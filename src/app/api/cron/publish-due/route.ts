import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publishTweetToX } from '@/lib/x/client';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    // Query due targets
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
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!dueTargets || dueTargets.length === 0) {
      return NextResponse.json({
        message: 'No scheduled posts due at this time',
        processed: 0,
      });
    }

    let processedCount = 0;
    let failedCount = 0;
    const results = [];

    for (const rawTarget of dueTargets) {
      const target = rawTarget as any;
      const postContent = target.posts?.content;
      const username = target.x_accounts?.username;

      // Mark as publishing
      await supabase
        .from('post_targets')
        .update({ status: 'publishing' })
        .eq('id', target.id);

      try {
        const xResult = await publishTweetToX({
          xAccountId: target.x_account_id,
          text: postContent,
        });

        await supabase
          .from('post_targets')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            x_post_id: xResult.xPostId,
            error_message: null,
          })
          .eq('id', target.id);

        await supabase
          .from('posts')
          .update({ status: 'published' })
          .eq('id', target.post_id);

        processedCount++;
        results.push({
          targetId: target.id,
          username,
          status: 'published',
          xPostId: xResult.xPostId,
        });
      } catch (err: any) {
        console.error(`Error publishing due post ${target.id}:`, err);

        await supabase
          .from('post_targets')
          .update({
            status: 'failed',
            error_message: err.message || 'Publishing error',
          })
          .eq('id', target.id);

        await supabase
          .from('posts')
          .update({ status: 'failed' })
          .eq('id', target.post_id);

        failedCount++;
        results.push({
          targetId: target.id,
          username,
          status: 'failed',
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      failed: failedCount,
      results,
    });
  } catch (err: any) {
    console.error('Cron publish error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
