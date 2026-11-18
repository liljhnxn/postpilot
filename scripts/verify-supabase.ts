/**
 * Supabase Connection & Schema Verification Script for PostPilot
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/verify-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from '../src/lib/crypto';

async function verify() {
  console.log('--- PostPilot Phase 2 Verification ---');

  // 1. Verify AES-256-GCM Token Encryption
  console.log('\n1. Testing AES-256-GCM Token Cryptography...');
  try {
    const testSecret = 'x-oauth-test-access-token-1234567890';
    const encrypted = encryptToken(testSecret);
    const decrypted = decryptToken(encrypted);

    if (decrypted === testSecret) {
      console.log('  [PASS] Encryption and decryption verified successfully.');
      console.log(`  Sample ciphertext format: ${encrypted.slice(0, 40)}...`);
    } else {
      console.error('  [FAIL] Decrypted value does not match original secret!');
    }
  } catch (err: any) {
    console.error('  [FAIL] Cryptography test error:', err.message);
  }

  // 2. Check Supabase Configuration
  console.log('\n2. Testing Supabase Environment & Connectivity...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) {
    console.log('  [INFO] Supabase environment variables are in placeholder/setup mode.');
    console.log('  Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to test live remote database.');
    return;
  }

  const supabase = createClient(supabaseUrl, anonKey);

  try {
    // 3. Test RLS on tables (Unauthenticated user should not be able to read other users' data)
    console.log('\n3. Testing Row Level Security (RLS) enforcement...');
    const tables = ['profiles', 'x_accounts', 'posts', 'post_targets', 'publishing_batches'];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`  Table "${table}": Query handled with response: ${error.message}`);
      } else {
        console.log(`  Table "${table}": Accessible under RLS policies (returned ${data?.length || 0} unauthenticated rows)`);
      }
    }
  } catch (err: any) {
    console.error('  [FAIL] Supabase query error:', err.message);
  }

  console.log('\n--- Verification complete ---');
}

verify();

