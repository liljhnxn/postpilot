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
    const daysParam = parseInt(searchParams.get('days') || '14', 10);
    const days = Math.min(Math.max(isNaN(daysParam) ? 14 : daysParam, 7), 90);

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);

    // 1. Fetch Connected Accounts
    const { data: accounts, error: accError } = await supabase
      .from('x_accounts')
      .select('id, username, display_name, profile_image_url, connection_status, created_at')
      .eq('user_id', user.id);

    if (accError) {
      console.error('Error fetching accounts for analytics:', accError);
    }

    // 2. Fetch Post Targets with associated Post and Account details
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
        retry_count,
        idempotency_key,
        created_at,
        posts (content),
        x_accounts (username, display_name, profile_image_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (targetsError) {
      console.error('Error fetching targets for analytics:', targetsError);
    }

    const allTargets = targets || [];
    const allAccounts = accounts || [];

    // Calculate Global KPIs
    let totalPublished = 0;
    let totalFailed = 0;
    let totalScheduled = 0;
    let totalPending = 0;

    let standaloneCount = 0;
    let threadCount = 0;
    let mediaCount = 0;

    // Accounts aggregation map
    const accountStatsMap: Record<
      string,
      {
        id: string;
        username: string;
        displayName: string;
        profileImageUrl: string | null;
        published: number;
        failed: number;
        scheduled: number;
        lastActivity: string | null;
      }
    > = {};

    allAccounts.forEach((acc: any) => {
      accountStatsMap[acc.id] = {
        id: acc.id,
        username: acc.username,
        displayName: acc.display_name,
        profileImageUrl: acc.profile_image_url,
        published: 0,
        failed: 0,
        scheduled: 0,
        lastActivity: null,
      };
    });

    // Time-series daily volume buckets (past N days)
    const dailyVolumeMap: Record<string, { date: string; label: string; published: number; failed: number; scheduled: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyVolumeMap[dateKey] = { date: dateKey, label, published: 0, failed: 0, scheduled: 0 };
    }

    allTargets.forEach((t: any) => {
      // Global counts
      if (t.status === 'published') totalPublished++;
      else if (t.status === 'failed') totalFailed++;
      else if (t.status === 'scheduled') totalScheduled++;
      else if (t.status === 'pending' || t.status === 'publishing') totalPending++;

      // Content formats
      const rawContent = t.posts?.content || '';
      const isThread = rawContent.startsWith('{') && rawContent.includes('"thread":');
      const hasMedia = rawContent.includes('media_urls') || rawContent.includes('data:image/');

      if (isThread) threadCount++;
      else standaloneCount++;

      if (hasMedia) mediaCount++;

      // Account breakdown
      if (accountStatsMap[t.x_account_id]) {
        const acc = accountStatsMap[t.x_account_id];
        if (t.status === 'published') acc.published++;
        else if (t.status === 'failed') acc.failed++;
        else if (t.status === 'scheduled') acc.scheduled++;

        const activityTime = t.published_at || t.scheduled_at || t.created_at;
        if (activityTime) {
          if (!acc.lastActivity || new Date(activityTime) > new Date(acc.lastActivity)) {
            acc.lastActivity = activityTime;
          }
        }
      }

      // Daily volume bucket matching
      const targetDate = t.published_at || t.scheduled_at || t.created_at;
      if (targetDate) {
        const dateKey = targetDate.split('T')[0];
        if (dailyVolumeMap[dateKey]) {
          if (t.status === 'published') dailyVolumeMap[dateKey].published++;
          else if (t.status === 'failed') dailyVolumeMap[dateKey].failed++;
          else if (t.status === 'scheduled') dailyVolumeMap[dateKey].scheduled++;
        }
      }
    });

    const totalResolved = totalPublished + totalFailed;
    const successRate = totalResolved > 0 ? Math.round((totalPublished / totalResolved) * 100) : 100;

    const accountBreakdown = Object.values(accountStatsMap).map((acc) => {
      const resolved = acc.published + acc.failed;
      const rate = resolved > 0 ? Math.round((acc.published / resolved) * 100) : 100;
      return {
        ...acc,
        successRate: rate,
        totalOperations: acc.published + acc.failed + acc.scheduled,
      };
    });

    const dailyVolume = Object.values(dailyVolumeMap);

    // Format audit logs (latest 50)
    const auditLogs = allTargets.slice(0, 50).map((t: any) => {
      let snippet = t.posts?.content || '';
      try {
        if (snippet.startsWith('{') && snippet.includes('"thread":')) {
          const parsed = JSON.parse(snippet);
          snippet = `🧵 Thread (${parsed.thread?.length || 0} tweets): ${parsed.thread?.[0] || ''}`;
        }
      } catch {}

      return {
        id: t.id,
        postId: t.post_id,
        content: snippet,
        username: t.x_accounts?.username || 'unknown',
        displayName: t.x_accounts?.display_name || 'X Account',
        profileImageUrl: t.x_accounts?.profile_image_url || null,
        status: t.status,
        scheduledAt: t.scheduled_at,
        publishedAt: t.published_at,
        xPostId: t.x_post_id,
        errorMessage: t.error_message,
        retryCount: t.retry_count,
        idempotencyKey: t.idempotency_key,
        createdAt: t.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      timeframeDays: days,
      overview: {
        totalOperations: allTargets.length,
        totalPublished,
        totalFailed,
        totalScheduled,
        totalPending,
        successRate,
        connectedAccountsCount: allAccounts.length,
      },
      formatBreakdown: {
        standalone: standaloneCount,
        threads: threadCount,
        media: mediaCount,
      },
      accountBreakdown,
      dailyVolume,
      auditLogs,
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compute analytics telemetry' },
      { status: 500 }
    );
  }
}
