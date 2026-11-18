import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardStats, RecentActivityItem } from '@/types';

/**
 * Fetches actual aggregated dashboard statistics from Supabase for the authenticated user.
 */
export async function getDashboardStats(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardStats> {
  // 1. Connected X accounts count
  const { count: accountsCount, error: accountsErr } = await supabase
    .from('x_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('connection_status', 'connected');

  if (accountsErr) {
    console.error('Error fetching accounts count:', accountsErr);
  }

  // 2. Published posts count (from post_targets)
  const { count: publishedCount, error: publishedErr } = await supabase
    .from('post_targets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'published');

  if (publishedErr) {
    console.error('Error fetching published count:', publishedErr);
  }

  // 3. Scheduled posts count
  const { count: scheduledCount, error: scheduledErr } = await supabase
    .from('post_targets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'scheduled');

  if (scheduledErr) {
    console.error('Error fetching scheduled count:', scheduledErr);
  }

  // 4. Failed posts count
  const { count: failedCount, error: failedErr } = await supabase
    .from('post_targets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'failed');

  if (failedErr) {
    console.error('Error fetching failed count:', failedErr);
  }

  return {
    connectedAccounts: accountsCount || 0,
    totalPublishedPosts: publishedCount || 0,
    scheduledPosts: scheduledCount || 0,
    failedPosts: failedCount || 0,
  };
}

/**
 * Retrieves the latest publishing activities for the user from Supabase.
 */
export async function getRecentActivities(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 5
): Promise<RecentActivityItem[]> {
  const { data, error } = await supabase
    .from('post_targets')
    .select(`
      id,
      status,
      published_at,
      scheduled_at,
      x_post_id,
      posts (content),
      x_accounts (username, display_name)
    `)
    .eq('user_id', userId)
    .in('status', ['published', 'failed', 'publishing'])
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('Error fetching recent activities:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    content: item.posts?.content || '',
    username: item.x_accounts?.username || 'unknown',
    accountDisplayName: item.x_accounts?.display_name || 'X Account',
    status: item.status,
    publishedAt: item.published_at,
    scheduledAt: item.scheduled_at,
    xPostId: item.x_post_id,
  }));
}

/**
 * Retrieves upcoming scheduled posts for the user from Supabase.
 */
export async function getUpcomingPosts(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 5
): Promise<RecentActivityItem[]> {
  const { data, error } = await supabase
    .from('post_targets')
    .select(`
      id,
      status,
      published_at,
      scheduled_at,
      x_post_id,
      posts (content),
      x_accounts (username, display_name)
    `)
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error('Error fetching upcoming posts:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    content: item.posts?.content || '',
    username: item.x_accounts?.username || 'unknown',
    accountDisplayName: item.x_accounts?.display_name || 'X Account',
    status: item.status,
    publishedAt: item.published_at,
    scheduledAt: item.scheduled_at,
    xPostId: item.x_post_id,
  }));
}

