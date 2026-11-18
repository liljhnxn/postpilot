import { SupabaseClient } from '@supabase/supabase-js';
import { XAccount } from '@/types';

/**
 * Retrieves all connected X accounts for the current user.
 * Note: Never selects encrypted_access_token or encrypted_refresh_token.
 */
export async function getUserXAccounts(
  supabase: SupabaseClient,
  userId: string
): Promise<XAccount[]> {
  const { data: accounts, error } = await supabase
    .from('x_accounts')
    .select(`
      id,
      user_id,
      x_user_id,
      username,
      display_name,
      profile_image_url,
      connection_status,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !accounts) {
    console.error('Error fetching user X accounts:', error);
    return [];
  }

  // Calculate published post counts per account
  const accountsWithCounts = await Promise.all(
    accounts.map(async (acc) => {
      const { count } = await supabase
        .from('post_targets')
        .select('*', { count: 'exact', head: true })
        .eq('x_account_id', acc.id)
        .eq('status', 'published');

      return {
        ...acc,
        published_count: count || 0,
      } as XAccount;
    })
  );

  return accountsWithCounts;
}

/**
 * Disconnects an X account for the user.
 */
export async function disconnectXAccount(
  supabase: SupabaseClient,
  userId: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('x_accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

