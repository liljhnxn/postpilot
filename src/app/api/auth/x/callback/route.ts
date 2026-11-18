import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getXOauthClient } from '@/lib/x/client';
import { encryptToken } from '@/lib/crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const cookieStore = cookies();
  const savedState = cookieStore.get('x_oauth_state')?.value;
  const codeVerifier = cookieStore.get('x_oauth_verifier')?.value;
  const cookieUserId = cookieStore.get('x_oauth_user_id')?.value;
  const savedRedirectUri = cookieStore.get('x_oauth_redirect_uri')?.value;

  const accountsUrl = new URL('/accounts', request.url);

  // Clean up cookies
  const clearCookie = (name: string) => {
    cookieStore.set(name, '', { maxAge: 0, path: '/' });
  };
  clearCookie('x_oauth_state');
  clearCookie('x_oauth_verifier');
  clearCookie('x_oauth_user_id');
  clearCookie('x_oauth_redirect_uri');

  // Handle user denied or cancelled authorization
  if (errorParam) {
    console.warn('X OAuth access denied or error:', errorParam, errorDescription);
    accountsUrl.searchParams.set(
      'error',
      errorParam === 'access_denied'
        ? 'Authorization was cancelled on X.'
        : `X Authorization error: ${errorDescription || errorParam}`
    );
    return NextResponse.redirect(accountsUrl);
  }

  // Validate state to prevent CSRF attacks
  if (!state || !savedState || state !== savedState) {
    accountsUrl.searchParams.set('error', 'OAuth state verification failed. Possible CSRF attempt.');
    return NextResponse.redirect(accountsUrl);
  }

  // Ensure code and code verifier are present
  if (!code || !codeVerifier) {
    accountsUrl.searchParams.set('error', 'Missing authorization code or PKCE verifier.');
    return NextResponse.redirect(accountsUrl);
  }

  if (!cookieUserId) {
    accountsUrl.searchParams.set('error', 'User session expired during authorization. Please try again.');
    return NextResponse.redirect(accountsUrl);
  }

  try {
    const redirectUri =
      savedRedirectUri ||
      process.env.X_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/auth/x/callback`;

    // 1. Exchange authorization code for tokens
    const oauthClient = getXOauthClient();
    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await oauthClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri,
    });

    // 2. Fetch authenticated X user's profile
    const { data: xUser } = await loggedClient.v2.me({
      'user.fields': ['profile_image_url', 'description'],
    });

    if (!xUser || !xUser.id) {
      throw new Error('Failed to retrieve X user profile after authorization.');
    }

    // 3. Encrypt access and refresh tokens using AES-256-GCM
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;
    const tokenExpiresAt = new Date(Date.now() + (expiresIn || 7200) * 1000).toISOString();

    // 4. Save connected account in Supabase database
    const supabase = createAdminClient();

    const { error: dbError } = await supabase
      .from('x_accounts')
      .upsert(
        {
          user_id: cookieUserId,
          x_user_id: xUser.id,
          username: xUser.username,
          display_name: xUser.name,
          profile_image_url: xUser.profile_image_url || null,
          encrypted_access_token: encryptedAccessToken,
          encrypted_refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          connection_status: 'connected',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,x_user_id',
        }
      );

    if (dbError) {
      console.error('Database error saving X account:', dbError);
      throw new Error(`Failed to save account in database: ${dbError.message}`);
    }

    accountsUrl.searchParams.set(
      'success',
      `Successfully connected @${xUser.username}!`
    );
    return NextResponse.redirect(accountsUrl);
  } catch (err: any) {
    console.error('Error in X OAuth callback handler:', err);
    accountsUrl.searchParams.set(
      'error',
      encodeURIComponent(err.message || 'Failed to complete X account connection.')
    );
    return NextResponse.redirect(accountsUrl);
  }
}

