import { NextResponse } from 'next/server';
import { envConfig, getMissingEnvWarnings } from '@/lib/env';
import { encryptToken, decryptToken } from '@/lib/crypto';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const warnings = getMissingEnvWarnings();

  let cryptoStatus = 'ok';
  try {
    const test = 'healthcheck_token';
    const enc = encryptToken(test);
    const dec = decryptToken(enc);
    if (dec !== test) cryptoStatus = 'mismatch';
  } catch (err: any) {
    cryptoStatus = `error: ${err.message}`;
  }

  let dbStatus = 'unconfigured';
  if (envConfig.supabase.isConfigured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      dbStatus = error ? `error: ${error.message}` : 'connected';
    } catch (err: any) {
      dbStatus = `exception: ${err.message}`;
    }
  }

  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    cryptoStatus,
    dbStatus,
    configured: {
      supabase: envConfig.supabase.isConfigured,
      x: envConfig.x.isConfigured,
      encryption: envConfig.encryption.isConfigured,
      inngest: envConfig.inngest.isConfigured,
    },
    missingWarnings: warnings,
  });
}

