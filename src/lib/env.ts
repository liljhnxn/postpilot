export const envConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    isConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
    ),
  },
  x: {
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    redirectUri: process.env.X_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/x/callback`,
    isConfigured: Boolean(
      process.env.X_CLIENT_ID &&
      process.env.X_CLIENT_SECRET &&
      process.env.X_CLIENT_ID !== 'your_x_oauth2_client_id'
    ),
  },
  encryption: {
    isConfigured: Boolean(
      process.env.TOKEN_ENCRYPTION_KEY &&
      process.env.TOKEN_ENCRYPTION_KEY !== '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    ),
  },
  inngest: {
    eventKey: process.env.INNGEST_EVENT_KEY || '',
    signingKey: process.env.INNGEST_SIGNING_KEY || '',
    isConfigured: Boolean(
      process.env.INNGEST_EVENT_KEY &&
      process.env.INNGEST_EVENT_KEY !== 'your_inngest_event_key'
    ),
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

export function getMissingEnvWarnings(): string[] {
  const warnings: string[] = [];
  if (!envConfig.supabase.isConfigured) {
    warnings.push('Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing or using placeholder values.');
  }
  if (!envConfig.x.isConfigured) {
    warnings.push('X Developer OAuth 2.0 credentials (X_CLIENT_ID, X_CLIENT_SECRET) are missing or using placeholder values.');
  }
  if (!envConfig.encryption.isConfigured) {
    warnings.push('TOKEN_ENCRYPTION_KEY is missing or using default placeholder. Required for secure AES-256 token encryption.');
  }
  return warnings;
}

