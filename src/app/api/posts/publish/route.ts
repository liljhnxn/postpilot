import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getXCharacterCount } from '@/lib/x/character-counter';
import { publishTweetToX } from '@/lib/x/client';
import crypto from 'crypto';

interface ThreadTweetInput {
  text: string;
  media?: string[];
}

interface PostInput {
  content: string;
  accountIds: string[];
  scheduledAt?: string | null;
  media?: string[];
  isThread?: boolean;
  threadTweets?: ThreadTweetInput[];
}

interface PublishRequestBody {
  posts: PostInput[];
  isScheduled?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PublishRequestBody & { simulationMode?: boolean } = await request.json();
    const { posts, isScheduled } = body;

    const isSimCookie = request.cookies.get('postpilot_simulation_mode')?.value === 'true';
    const isSimulation = body.simulationMode === true || isSimCookie || process.env.SIMULATION_MODE === 'true';

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'At least one post is required' }, { status: 400 });
    }

    // 2. Validate every post content & account selection
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];

      if (p.isThread && p.threadTweets && p.threadTweets.length > 0) {
        for (let t = 0; t < p.threadTweets.length; t++) {
          const tweet = p.threadTweets[t];
          if (!tweet.text || !tweet.text.trim()) {
            return NextResponse.json(
              { error: `Thread #${i + 1}, Tweet #${t + 1} content cannot be empty.` },
              { status: 400 }
            );
          }
          const { count, isValid } = getXCharacterCount(tweet.text);
          if (!isValid) {
            return NextResponse.json(
              {
                error: `Thread #${i + 1}, Tweet #${t + 1} exceeds official X limit (${count}/280 characters).`,
              },
              { status: 400 }
            );
          }
        }
      } else {
        if (!p.content || !p.content.trim()) {
          return NextResponse.json(
            { error: `Post #${i + 1} content cannot be empty.` },
            { status: 400 }
          );
        }

        const { count, isValid } = getXCharacterCount(p.content);
        if (!isValid) {
          return NextResponse.json(
            {
              error: `Post #${i + 1} exceeds official X character limit (${count}/280 weighted characters).`,
            },
            { status: 400 }
          );
        }
      }

      if (!p.accountIds || p.accountIds.length === 0) {
        return NextResponse.json(
          { error: `Post #${i + 1} has no X account selected.` },
          { status: 400 }
        );
      }
    }

    // 3. Create a publishing batch record to group all operations
    let totalOperations = 0;
    posts.forEach((p) => {
      totalOperations += p.accountIds.length;
    });

    const { data: batch, error: batchError } = await supabase
      .from('publishing_batches')
      .insert({
        user_id: user.id,
        status: isScheduled ? 'pending' : 'processing',
        total_operations: totalOperations,
        successful_operations: 0,
        failed_operations: 0,
      })
      .select('id')
      .single();

    if (batchError || !batch) {
      console.error('Batch creation error:', batchError);
      return NextResponse.json(
        { error: 'Failed to initialize publishing batch' },
        { status: 500 }
      );
    }

    // 4. Save posts and post_targets in database
    const createdTargets: {
      targetId: string;
      postId: string;
      xAccountId: string;
      content: string;
      scheduledAt: string | null;
      media?: string[];
    }[] = [];

    for (const postData of posts) {
      let finalContent = postData.content;
      if (postData.isThread && postData.threadTweets && postData.threadTweets.length > 1) {
        finalContent = JSON.stringify({
          thread: postData.threadTweets.map((t) => ({
            text: t.text,
            mediaBase64: t.media || [],
          })),
        });
      }

      // Insert master post
      const { data: savedPost, error: postErr } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: finalContent,
          status: isScheduled ? 'scheduled' : 'publishing',
        })
        .select('id')
        .single();

      if (postErr || !savedPost) {
        console.error('Error inserting post:', postErr);
        continue;
      }

      // Insert target for each selected account
      for (const accountId of postData.accountIds) {
        // Generate idempotency key to prevent accidental duplicate publishing
        const idempotencyKey = crypto
          .createHash('sha256')
          .update(`${user.id}_${savedPost.id}_${accountId}_${Date.now()}`)
          .digest('hex');

        const { data: target, error: targetErr } = await supabase
          .from('post_targets')
          .insert({
            post_id: savedPost.id,
            user_id: user.id,
            x_account_id: accountId,
            batch_id: batch.id,
            status: isScheduled ? 'scheduled' : 'publishing',
            scheduled_at: postData.scheduledAt || null,
            idempotency_key: idempotencyKey,
          })
          .select('id')
          .single();

        if (targetErr || !target) {
          console.error('Error inserting post target:', targetErr);
          continue;
        }

        createdTargets.push({
          targetId: target.id,
          postId: savedPost.id,
          xAccountId: accountId,
          content: finalContent,
          scheduledAt: postData.scheduledAt || null,
          media: postData.media,
        });
      }
    }

    // 5. If Scheduled: Return confirmation immediately (scheduled targets will be handled by background runner)
    if (isScheduled) {
      return NextResponse.json({
        success: true,
        isScheduled: true,
        batchId: batch.id,
        totalOperations,
        scheduledCount: createdTargets.length,
        message: `Successfully scheduled ${posts.length} post(s) across ${totalOperations} target account dispatch(es).`,
      });
    }

    // 6. If Publish Now: Dispatch each post to official X API v2 (POST https://api.x.com/2/tweets)
    const operationResults: {
      targetId: string;
      postId: string;
      accountId: string;
      username?: string;
      status: 'published' | 'failed';
      xPostId?: string;
      tweetUrl?: string;
      error?: string;
    }[] = [];

    let successCount = 0;
    let failedCount = 0;

    // Fetch accounts details (for usernames in response)
    const { data: accountsData } = await supabase
      .from('x_accounts')
      .select('id, username, display_name')
      .in('id', Array.from(new Set(createdTargets.map((t) => t.xAccountId))));

    const accountMap = new Map<string, { username: string; display_name: string }>();
    accountsData?.forEach((acc) => {
      accountMap.set(acc.id, { username: acc.username, display_name: acc.display_name });
    });

    for (const target of createdTargets) {
      const accountInfo = accountMap.get(target.xAccountId);
      const username = accountInfo?.username || 'unknown';

      try {
        // Execute tweet publication (live or simulation mode)
        const xResult = await publishTweetToX({
          xAccountId: target.xAccountId,
          text: target.content,
          mediaBase64: target.media,
          isSimulation,
        });

        // Record successful publishing
        await supabase
          .from('post_targets')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            x_post_id: xResult.xPostId,
            error_message: null,
          })
          .eq('id', target.targetId);

        successCount++;
        operationResults.push({
          targetId: target.targetId,
          postId: target.postId,
          accountId: target.xAccountId,
          username,
          status: 'published',
          xPostId: xResult.xPostId,
          tweetUrl: `https://x.com/${username}/status/${xResult.xPostId}`,
        });
      } catch (tweetErr: any) {
        console.error(`Failed to publish tweet to @${username}:`, tweetErr);
        const errMsg = tweetErr.message || 'Error communicating with X API';

        // Record failed operation with error details
        await supabase
          .from('post_targets')
          .update({
            status: 'failed',
            error_message: errMsg,
          })
          .eq('id', target.targetId);

        failedCount++;
        operationResults.push({
          targetId: target.targetId,
          postId: target.postId,
          accountId: target.xAccountId,
          username,
          status: 'failed',
          error: errMsg,
        });
      }
    }

    // Update master posts status
    const postIds = Array.from(new Set(createdTargets.map((t) => t.postId)));
    for (const pId of postIds) {
      const targetsForPost = operationResults.filter((r) => r.postId === pId);
      const allSuccess = targetsForPost.every((r) => r.status === 'published');
      const allFail = targetsForPost.every((r) => r.status === 'failed');

      const postStatus = allSuccess
        ? 'published'
        : allFail
        ? 'failed'
        : 'partially_published';

      await supabase
        .from('posts')
        .update({ status: postStatus })
        .eq('id', pId);
    }

    // Update batch record
    const finalBatchStatus =
      failedCount === 0
        ? 'completed'
        : successCount > 0
        ? 'partial_failure'
        : 'failed';

    await supabase
      .from('publishing_batches')
      .update({
        status: finalBatchStatus,
        successful_operations: successCount,
        failed_operations: failedCount,
      })
      .eq('id', batch.id);

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalOperations,
      successfulOperations: successCount,
      failedOperations: failedCount,
      results: operationResults,
    });
  } catch (err: any) {
    console.error('Publish API Error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during publishing.' },
      { status: 500 }
    );
  }
}

