import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getXOauthClient, X_SCOPES } from '@/lib/x/client';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // 1. Ensure user is authenticated in PostPilot
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', '/accounts');
      loginUrl.searchParams.set('error', 'Please log in to connect an X account');
      return NextResponse.redirect(loginUrl);
    }

    // 2. Determine redirect URI
    // Prefer environment variable, fallback to current origin
    const redirectUri =
      process.env.X_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/auth/x/callback`;

    // 3. Generate OAuth 2.0 PKCE auth link
    const client = getXOauthClient();
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      redirectUri,
      {
        scope: X_SCOPES,
      }
    );

    // 4. Store state, codeVerifier, and user_id in secure HTTP-only cookies
    const cookieStore = cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    };

    cookieStore.set('x_oauth_state', state, cookieOptions);
    cookieStore.set('x_oauth_verifier', codeVerifier, cookieOptions);
    cookieStore.set('x_oauth_user_id', user.id, cookieOptions);
    cookieStore.set('x_oauth_redirect_uri', redirectUri, cookieOptions);

    // 5. Redirect user to X Authorization screen
    return NextResponse.redirect(url);
  } catch (err: any) {
    console.error('Error generating X OAuth link:', err);
    const errorUrl = new URL('/accounts', request.url);
    errorUrl.searchParams.set('error', encodeURIComponent(err.message || 'Failed to initiate X authorization'));
    return NextResponse.redirect(errorUrl);
  }
}

