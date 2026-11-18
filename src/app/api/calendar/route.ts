import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10); // 1-12

    // Compute start and end date for month (with 7 days buffer for calendar grid padding)
    const start = new Date(year, month - 1, 1);
    start.setDate(start.getDate() - 7);
    const end = new Date(year, month, 0);
    end.setDate(end.getDate() + 7);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    // Query scheduled and published post targets
    const { data: targets, error: targetsError } = await supabase
      .from('post_targets')
      .select(`
        id,
        post_id,
        x_account_id,
        status,
        scheduled_at,
        published_at,
        x_post_id,
        error_message,
        posts (content),
        x_accounts (username, display_name, profile_image_url)
      `)
      .eq('user_id', user.id)
      .or(`scheduled_at.gte.${startIso},published_at.gte.${startIso}`)
      .order('scheduled_at', { ascending: true, nullsFirst: false });

    if (targetsError) {
      console.error('Error fetching calendar targets:', targetsError);
      return NextResponse.json({ error: targetsError.message }, { status: 400 });
    }

    const items = (targets || []).map((t: any) => {
      const eventDate = t.scheduled_at || t.published_at;
      let snippet = t.posts?.content || '';
      try {
        if (snippet.startsWith('{') && snippet.includes('"thread":')) {
          const parsed = JSON.parse(snippet);
          snippet = `🧵 (${parsed.thread?.length || 0} tweets) ${parsed.thread?.[0] || ''}`;
        }
      } catch {}

      return {
        id: t.id,
        postId: t.post_id,
        content: snippet,
        date: eventDate ? eventDate.split('T')[0] : null,
        fullTimestamp: eventDate,
        status: t.status,
        username: t.x_accounts?.username || 'account',
        displayName: t.x_accounts?.display_name || 'X Account',
        profileImageUrl: t.x_accounts?.profile_image_url || null,
        xPostId: t.x_post_id,
        errorMessage: t.error_message,
      };
    });

    return NextResponse.json({
      success: true,
      year,
      month,
      items,
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/calendar:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

