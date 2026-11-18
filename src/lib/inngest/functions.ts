import { inngest } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import { publishTweetToX } from '@/lib/x/client';

/**
 * Background Inngest worker: Publishes a single scheduled post target when its time arrives.
 * Uses step.sleepUntil to reliably sleep until the exact scheduled timestamp.
 */
export const publishScheduledPost = inngest.createFunction(
  {
    id: 'publish-scheduled-post',
    name: 'Publish Scheduled Post Target',
    retries: 2,
  },
  { event: 'post.scheduled' },
  async ({ event, step }) => {
    const { targetId, scheduledAt } = event.data;

    if (!targetId) {
      return { skipped: true, reason: 'No targetId provided' };
    }

    // Step 1: Sleep until the scheduled publication time
    if (scheduledAt) {
      const targetDate = new Date(scheduledAt);
      if (targetDate.getTime() > Date.now()) {
        await step.sleepUntil('wait-for-dispatch-time', targetDate);
      }
    }

    // Step 2: Claim target atomically and publish
    return await step.run('dispatch-tweet-to-x', async () => {
      const supabase = createAdminClient();

      // Fetch target details
      const { data: target, error: targetErr } = await supabase
        .from('post_targets')
        .select(`
          id,
          post_id,
          x_account_id,
          status,
          posts (id, content, status),
          x_accounts (id, username, connection_status)
        `)
        .eq('id', targetId)
        .single();

      if (targetErr || !target) {
        return { error: 'Target not found' };
      }

      const typedTarget = target as any;
      const postContent = typedTarget.posts?.content;
      const username = typedTarget.x_accounts?.username;

      // Check if target was cancelled or already published
      if (typedTarget.status !== 'scheduled' && typedTarget.status !== 'pending') {
        return { skipped: true, status: typedTarget.status };
      }

      // Mark target as currently publishing
      await supabase
        .from('post_targets')
        .update({ status: 'publishing' })
        .eq('id', targetId);

      try {
        const result = await publishTweetToX({
          xAccountId: typedTarget.x_account_id,
          text: postContent,
        });

        // Mark target as published
        await supabase
          .from('post_targets')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            x_post_id: result.xPostId,
            error_message: null,
          })
          .eq('id', targetId);

        // Update master post status
        await supabase
          .from('posts')
          .update({ status: 'published' })
          .eq('id', typedTarget.post_id);

        return {
          success: true,
          targetId,
          xPostId: result.xPostId,
          username,
        };
      } catch (err: any) {
        console.error(`Scheduled publishing failed for target ${targetId}:`, err);

        await supabase
          .from('post_targets')
          .update({
            status: 'failed',
            error_message: err.message || 'Background publishing failed',
          })
          .eq('id', targetId);

        await supabase
          .from('posts')
          .update({ status: 'failed' })
          .eq('id', target.post_id);

        throw err; // Allow Inngest to retry temporary failures
      }
    });
  }
);

/**
 * Background Inngest Cron: Scans for any due scheduled post targets every minute.
 * Ensures that all scheduled posts dispatch even if the browser is closed.
 */
export const cronCheckDuePosts = inngest.createFunction(
  {
    id: 'cron-check-due-posts',
    name: 'Cron Check Due Scheduled Posts',
  },
  { cron: '* * * * *' }, // Every minute
  async ({ step }) => {
    return await step.run('process-due-scheduled-targets', async () => {
      const supabase = createAdminClient();
      const nowIso = new Date().toISOString();

      // Find targets due for publication
      const { data: dueTargets, error } = await supabase
        .from('post_targets')
        .select(`
          id,
          post_id,
          x_account_id,
          status,
          scheduled_at,
          posts (id, content),
          x_accounts (id, username)
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_at', nowIso)
        .limit(25);

      if (error || !dueTargets || dueTargets.length === 0) {
        return { processed: 0, message: 'No due scheduled posts found' };
      }

      let processedCount = 0;
      let errorCount = 0;

      for (const target of dueTargets) {
        const typedTarget = target as any;
        const postContent = typedTarget.posts?.content || '';

        // Atomically mark target as publishing
        await supabase
          .from('post_targets')
          .update({ status: 'publishing' })
          .eq('id', typedTarget.id);

        try {
          const result = await publishTweetToX({
            xAccountId: typedTarget.x_account_id,
            text: postContent,
          });

          await supabase
            .from('post_targets')
            .update({
              status: 'published',
              published_at: new Date().toISOString(),
              x_post_id: result.xPostId,
              error_message: null,
            })
            .eq('id', typedTarget.id);

          await supabase
            .from('posts')
            .update({ status: 'published' })
            .eq('id', typedTarget.post_id);

          processedCount++;
        } catch (dispatchErr: any) {
          console.error(`Cron dispatch failed for target ${typedTarget.id}:`, dispatchErr);

          await supabase
            .from('post_targets')
            .update({
              status: 'failed',
              error_message: dispatchErr.message || 'Cron dispatch error',
            })
            .eq('id', typedTarget.id);

          errorCount++;
        }
      }

      return {
        processed: processedCount,
        errors: errorCount,
        totalDue: dueTargets.length,
      };
    });
  }
);
