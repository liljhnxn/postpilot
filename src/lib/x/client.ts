import { TwitterApi } from 'twitter-api-v2';
import { decryptToken, encryptToken } from '@/lib/crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const X_SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'media.write',
  'offline.access',
];

/**
 * Creates an unauthenticated TwitterApi instance with Client ID and Secret
 * Used for OAuth2 Authorization Code with PKCE initiation & code exchange.
 */
export function getXOauthClient() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  if (!clientId) {
    throw new Error('X_CLIENT_ID is not configured');
  }

  return new TwitterApi({
    clientId,
    clientSecret: clientSecret || undefined,
  });
}

/**
 * Retrieves a valid authorized TwitterApi client for a given connected account ID.
 * Automatically refreshes the OAuth2 token if expired or about to expire.
 */
export async function getXUserClient(xAccountId: string): Promise<TwitterApi> {
  const supabase = createAdminClient();

  const { data: account, error } = await supabase
    .from('x_accounts')
    .select('*')
    .eq('id', xAccountId)
    .single();

  if (error || !account) {
    throw new Error(`X Account not found for ID: ${xAccountId}`);
  }

  if (account.connection_status === 'revoked') {
    throw new Error(`Account @${account.username} authorization has been revoked. Please reconnect.`);
  }

  const accessToken = decryptToken(account.encrypted_access_token);
  const refreshToken = account.encrypted_refresh_token
    ? decryptToken(account.encrypted_refresh_token)
    : null;

  // Check if token is expired or within 5 minutes of expiring
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  const now = Date.now();
  const isExpired = expiresAt > 0 && expiresAt - now < 5 * 60 * 1000;

  if (isExpired && refreshToken) {
    try {
      const oauthClient = getXOauthClient();
      const {
        client: refreshedClient,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      } = await oauthClient.refreshOAuth2Token(refreshToken);

      const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Update in database with newly encrypted tokens
      await supabase
        .from('x_accounts')
        .update({
          encrypted_access_token: encryptToken(newAccessToken),
          encrypted_refresh_token: newRefreshToken ? encryptToken(newRefreshToken) : account.encrypted_refresh_token,
          token_expires_at: newExpiresAt,
          connection_status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', xAccountId);

      return refreshedClient;
    } catch (refreshErr: any) {
      console.error('Failed to refresh X token:', refreshErr);
      // Mark as expired in DB
      await supabase
        .from('x_accounts')
        .update({
          connection_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', xAccountId);

      throw new Error(
        `Session expired for @${account.username}. Please reconnect your account in the Accounts page.`
      );
    }
  }

  // Token is still valid, return client with Bearer token
  return new TwitterApi(accessToken);
}

/**
 * Publishes a tweet or a connected multi-tweet thread to official X API v2:
 * - Single Tweet: POST https://api.x.com/2/tweets
 * - Multi-Tweet Thread: Chained replies via in_reply_to_tweet_id
 * Supports optional images (as base64 data URLs or raw base64 strings).
 */
export async function publishTweetToX({
  xAccountId,
  text,
  mediaBase64,
  threadTweets,
  isSimulation,
}: {
  xAccountId: string;
  text: string;
  mediaBase64?: string[];
  threadTweets?: { text: string; mediaBase64?: string[] }[];
  isSimulation?: boolean;
}): Promise<{ xPostId: string; text: string }> {
  // Check if this is a thread
  let threadItems: { text: string; mediaBase64?: string[] }[] = [];
  if (threadTweets && threadTweets.length > 0) {
    threadItems = threadTweets;
  } else if (typeof text === 'string' && text.startsWith('{"thread":')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.thread) && parsed.thread.length > 0) {
        threadItems = parsed.thread;
      }
    } catch {}
  }

  // Simulation / Demo Mode (bypasses X rate limits and depleted credits)
  const isSim = isSimulation ?? (process.env.SIMULATION_MODE === 'true');
  if (isSim) {
    console.log(`[SIMULATION MODE] Bypassing X API limits — generated mock publish for account: ${xAccountId}`);
    await new Promise((r) => setTimeout(r, 350));
    const mockTweetId = `sim_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    return {
      xPostId: mockTweetId,
      text: threadItems.length > 0 ? threadItems[0].text : text,
    };
  }

  const client = await getXUserClient(xAccountId);

  try {
    // --------------------------------------------------------------------------
    // A. Multi-Tweet Thread Publishing Flow
    // --------------------------------------------------------------------------
    if (threadItems.length > 1) {
      const threadIds: string[] = [];
      let previousTweetId: string | null = null;

      for (let i = 0; i < threadItems.length; i++) {
        const item = threadItems[i];
        const mediaIds: string[] = [];

        // Upload any attached images for this specific tweet in thread
        if (item.mediaBase64 && item.mediaBase64.length > 0) {
          for (const m of item.mediaBase64) {
            let mimeType = 'image/jpeg';
            let base64Data = m;

            if (m.startsWith('data:')) {
              const matches = m.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
              }
            }

            const buffer = Buffer.from(base64Data, 'base64');
            try {
              const mId = await client.v1.uploadMedia(buffer, { mimeType });
              if (mId) mediaIds.push(mId);
            } catch (mediaErr: any) {
              console.error('Media upload error in thread:', mediaErr);
              if (mediaErr.code === 403 || mediaErr.status === 403) {
                throw new Error(
                  'X API Error (403): The Free X Developer API tier restricts automated image/media uploads (requires X Basic tier). Remove the image to publish on the Free tier.'
                );
              }
              throw mediaErr;
            }
          }
        }

        const payload: any = { text: item.text };
        if (mediaIds.length > 0) {
          payload.media = { media_ids: mediaIds };
        }
        if (previousTweetId) {
          payload.reply = { in_reply_to_tweet_id: previousTweetId };
        }

        const res = await client.v2.tweet(payload);
        if (!res.data || !res.data.id) {
          throw new Error(`No tweet ID returned for thread item #${i + 1}`);
        }

        previousTweetId = res.data.id;
        threadIds.push(res.data.id);
      }

      return {
        xPostId: threadIds[0],
        text: threadItems[0].text,
      };
    }

    // --------------------------------------------------------------------------
    // B. Single Tweet Publishing Flow
    // --------------------------------------------------------------------------
    const mediaIds: string[] = [];

    // Upload any attached images to X via v1.uploadMedia
    if (mediaBase64 && mediaBase64.length > 0) {
      for (const item of mediaBase64) {
        let mimeType = 'image/jpeg';
        let base64Data = item;

        if (item.startsWith('data:')) {
          const matches = item.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        }

        const buffer = Buffer.from(base64Data, 'base64');
        try {
          const mediaId = await client.v1.uploadMedia(buffer, { mimeType });
          if (mediaId) {
            mediaIds.push(mediaId);
          }
        } catch (mediaErr: any) {
          console.error('Media upload specific error:', mediaErr);
          if (mediaErr.code === 403 || mediaErr.status === 403) {
            throw new Error(
              'X API Error (403): The Free X Developer API tier restricts automated image/media uploads (requires X Basic tier). Remove the image to publish on the Free tier.'
            );
          }
          throw mediaErr;
        }
      }
    }

    const tweetPayload: any = { text };
    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds };
    }

    const response = await client.v2.tweet(tweetPayload);

    if (!response.data || !response.data.id) {
      throw new Error('No tweet ID returned from X API');
    }

    return {
      xPostId: response.data.id,
      text: response.data.text,
    };
  } catch (err: any) {
    console.error('X Publish Error Full Details:', {
      message: err.message,
      code: err.code,
      status: err.status,
      data: err.data,
      errors: err.errors,
      error: err.error,
      rateLimit: err.rateLimit,
    });

    // 1. Check for 402 Payment Required / Credits Depleted
    if (err.code === 402 || err.status === 402 || err.data?.detail?.includes('credits depleted')) {
      throw new Error(
        'X API Error (402 - Credits Depleted): Your X Developer account has run out of API credits. Log into https://developer.x.com -> Billing / Usage to check your credits.'
      );
    }

    // 2. Check for rate limit (429)
    if (err.code === 429 || err.status === 429) {
      let resetInfo = 'in a few minutes';
      if (err.rateLimit?.reset) {
        const resetDate = new Date(err.rateLimit.reset * 1000);
        const minutesLeft = Math.max(1, Math.ceil((resetDate.getTime() - Date.now()) / 60000));
        resetInfo = `${resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (~${minutesLeft} min${minutesLeft === 1 ? '' : 's'} from now)`;
      }
      throw new Error(`X API Rate Limit Exceeded (429). Reset at: ${resetInfo}`);
    }

    // Capture X API specific error details (v2 or v1)
    const detailedMessage =
      err.data?.detail ||
      err.data?.title ||
      err.data?.errors?.[0]?.message ||
      err.errors?.[0]?.message ||
      err.error?.message ||
      err.message ||
      'Unknown error publishing tweet to X';

    throw new Error(`X API Error (${err.code || err.status || 403}): ${detailedMessage}`);
  }
}

