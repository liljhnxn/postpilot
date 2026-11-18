import { SupabaseClient } from '@supabase/supabase-js';
import { Post, PostTarget, TargetStatus } from '@/types';

/**
 * Retrieves scheduled post targets for the user.
 */
export async function getUserScheduledPosts(
  supabase: SupabaseClient,
  userId: string
): Promise<PostTarget[]> {
  const { data, error } = await supabase
    .from('post_targets')
    .select(`
      id,
      post_id,
      user_id,
      x_account_id,
      status,
      scheduled_at,
      published_at,
      x_post_id,
      error_message,
      retry_count,
      created_at,
      updated_at,
      posts (id, content, status),
      x_accounts (id, username, display_name, profile_image_url)
    `)
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching scheduled posts:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    post_id: item.post_id,
    user_id: item.user_id,
    x_account_id: item.x_account_id,
    status: item.status,
    scheduled_at: item.scheduled_at,
    published_at: item.published_at,
    x_post_id: item.x_post_id,
    error_message: item.error_message,
    retry_count: item.retry_count,
    created_at: item.created_at,
    updated_at: item.updated_at,
    post: item.posts,
    x_account: item.x_accounts,
  }));
}

/**
 * Retrieves published / failed post targets with optional status filter.
 */
export async function getUserPublishedHistory(
  supabase: SupabaseClient,
  userId: string,
  filter?: 'all' | 'published' | 'failed'
): Promise<PostTarget[]> {
  let query = supabase
    .from('post_targets')
    .select(`
      id,
      post_id,
      user_id,
      x_account_id,
      status,
      scheduled_at,
      published_at,
      x_post_id,
      error_message,
      retry_count,
      created_at,
      updated_at,
      posts (id, content, status),
      x_accounts (id, username, display_name, profile_image_url)
    `)
    .eq('user_id', userId)
    .in('status', filter === 'published' ? ['published'] : filter === 'failed' ? ['failed'] : ['published', 'failed'])
    .order('updated_at', { ascending: false });

  const { data, error } = await query;

  if (error || !data) {
    console.error('Error fetching published history:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    post_id: item.post_id,
    user_id: item.user_id,
    x_account_id: item.x_account_id,
    status: item.status,
    scheduled_at: item.scheduled_at,
    published_at: item.published_at,
    x_post_id: item.x_post_id,
    error_message: item.error_message,
    retry_count: item.retry_count,
    created_at: item.created_at,
    updated_at: item.updated_at,
    post: item.posts,
    x_account: item.x_accounts,
  }));
}

