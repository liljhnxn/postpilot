import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishTweetToX } from '@/lib/x/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSimCookie = request.cookies.get('postpilot_simulation_mode')?.value === 'true';
    const isSimulation = isSimCookie || process.env.SIMULATION_MODE === 'true';

    const { id } = params;

    // Fetch target with post content
    const { data: target, error: targetErr } = await supabase
      .from('post_targets')
      .select('*, posts(content), x_accounts(username)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (targetErr || !target) {
      return NextResponse.json({ error: 'Post target not found' }, { status: 404 });
    }

    // Mark as publishing
    await supabase
      .from('post_targets')
      .update({ status: 'publishing', retry_count: (target.retry_count || 0) + 1 })
      .eq('id', id);

    try {
      const result = await publishTweetToX({
        xAccountId: target.x_account_id,
        text: target.posts.content,
        isSimulation,
      });

      await supabase
        .from('post_targets')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          x_post_id: result.xPostId,
          error_message: null,
        })
        .eq('id', id);

      return NextResponse.json({
        success: true,
        xPostId: result.xPostId,
        username: target.x_accounts?.username,
      });
    } catch (retryErr: any) {
      await supabase
        .from('post_targets')
        .update({
          status: 'failed',
          error_message: retryErr.message || 'Retry failed',
        })
        .eq('id', id);

      return NextResponse.json(
        { error: retryErr.message || 'Retry failed' },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('Retry error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

