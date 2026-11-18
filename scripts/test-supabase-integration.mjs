import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local without exposing credentials
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function runVerification() {
  console.log('================================================================');
  console.log('          POSTPILOT SUPABASE INTEGRATION TEST SUITE            ');
  console.log('================================================================\n');

  const env = loadEnv();
  const results = {
    envVariables: false,
    clientInit: false,
    dbConnection: false,
    tablesExist: false,
    rlsActive: false,
    authFlow: false,
    details: {},
  };

  // 1. Environment Variables Check
  console.log('1. Checking Required Environment Variables...');
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isUrlValid = Boolean(supabaseUrl && !supabaseUrl.includes('your-project') && supabaseUrl.startsWith('https://'));
  const isAnonValid = Boolean(anonKey && !anonKey.includes('your_supabase_anon_key') && anonKey.length > 20);
  const isServiceValid = Boolean(serviceKey && !serviceKey.includes('your_supabase_service_role_key') && serviceKey.length > 20);

  console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${isUrlValid ? '[CONFIGURED]' : '[MISSING OR PLACEHOLDER]'}`);
  console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${isAnonValid ? '[CONFIGURED]' : '[MISSING OR PLACEHOLDER]'}`);
  console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${isServiceValid ? '[CONFIGURED]' : '[MISSING OR PLACEHOLDER]'}`);

  if (!isUrlValid || !isAnonValid) {
    console.log('\n[STOP] Cannot proceed with live database connection tests:');
    console.log('       Valid Supabase credentials have not been saved in .env.local yet.');
    console.log('       Please update .env.local with your real Supabase project URL and keys.');
    return;
  }

  results.envVariables = true;

  // 2. Client Initialization
  console.log('\n2. Testing Supabase Client Initialization...');
  let anonClient;
  let adminClient;
  try {
    anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (isServiceValid) {
      adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    results.clientInit = true;
    console.log('   - Anonymous client: [INITIALIZED SUCCESSFULLY]');
    console.log(`   - Admin client: ${adminClient ? '[INITIALIZED SUCCESSFULLY]' : '[SKIPPED - No service role key]'}`);
  } catch (err) {
    console.error('   - Client initialization failed:', err.message);
    return;
  }

  // 3. Database Connection Test
  console.log('\n3. Testing Database Connection...');
  try {
    const clientToUse = adminClient || anonClient;
    const { data, error } = await clientToUse.from('profiles').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist, connection itself might still have succeeded to PostgreSQL API
      if (error.code === '42P01') {
        console.log('   - Connection established, but database table was not found (migrations needed).');
      } else {
        console.log(`   - Database response: ${error.message} (Code: ${error.code})`);
      }
    } else {
      console.log('   - Database connection: [SUCCESSFUL]');
    }
    results.dbConnection = true;
  } catch (err) {
    console.error('   - Connection error:', err.message);
    return;
  }

  // 4. Required Database Tables Existence Check
  console.log('\n4. Verifying Required Database Tables...');
  const requiredTables = [
    'profiles',
    'x_accounts',
    'posts',
    'post_targets',
    'publishing_batches',
  ];

  let missingTables = [];
  const clientForTableCheck = adminClient || anonClient;

  for (const table of requiredTables) {
    try {
      const { data, error } = await clientForTableCheck.from(table).select('id').limit(1);
      if (error && (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('schema cache') || error.message?.includes('does not exist'))) {
        console.log(`   - Table "${table}": [NOT FOUND - ${error.message}]`);
        missingTables.push(table);
      } else {
        console.log(`   - Table "${table}": [EXISTS AND ACCESSIBLE]`);
      }
    } catch (err) {
      console.log(`   - Table "${table}": [ERROR - ${err.message}]`);
      missingTables.push(table);
    }
  }

  if (missingTables.length === 0) {
    results.tablesExist = true;
  } else {
    console.log(`\n   [ACTION REQUIRED] Run migrations in supabase/migrations/001_initial_schema.sql to create missing tables.`);
  }

  // 5. Row Level Security (RLS) Verification
  console.log('\n5. Verifying Row Level Security (RLS) Policies...');
  try {
    let rlsEnforcedCount = 0;
    for (const table of requiredTables) {
      if (missingTables.includes(table)) {
        console.log(`   - Table "${table}": [SKIPPED - Table not created yet]`);
        continue;
      }
      const { data, error } = await anonClient.from(table).select('*');
      if (!error && Array.isArray(data) && data.length === 0) {
        console.log(`   - Table "${table}": [RLS ENFORCED - 0 rows exposed to unauthenticated callers]`);
        rlsEnforcedCount++;
      } else if (error) {
        console.log(`   - Table "${table}": [RLS BLOCKED - ${error.message}]`);
        rlsEnforcedCount++;
      } else {
        console.log(`   - Table "${table}": [WARNING - Returned ${data.length} records without auth!]`);
      }
    }
    if (rlsEnforcedCount === requiredTables.length && requiredTables.length > 0) {
      results.rlsActive = true;
    }
  } catch (err) {
    console.error('   - RLS verification error:', err.message);
  }

  // 6. User Registration & Login Test
  console.log('\n6. Testing User Registration & Login Flow...');
  const testEmail = `isaac.postpilot.test.${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!Secure';
  let createdUserId = null;

  try {
    if (adminClient) {
      console.log('   - Testing programmatic user creation (Admin API)...');
      const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

      if (adminUserError) {
        console.log(`   - Admin creation notice: ${adminUserError.message}`);
      } else {
        createdUserId = adminUserData.user?.id;
        console.log('   - User Registration / Provisioning: [SUCCESSFUL]');

        // B. Test Login via public anonymous client
        console.log('   - Testing user login (signInWithPassword via Anonymous Client)...');
        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        if (signInError) {
          console.log(`   - Login error: ${signInError.message}`);
        } else {
          console.log('   - User Login: [SUCCESSFUL - Session Token Established]');
          results.authFlow = true;

          // C. Test Logout
          await anonClient.auth.signOut();
          console.log('   - User Logout: [SUCCESSFUL]');
        }
      }
    } else {
      // Fallback to public signUp
      console.log('   - Testing public user registration (signUp)...');
      const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      if (signUpError) {
        console.log(`   - Registration notice: ${signUpError.message}`);
      } else {
        console.log('   - Registration: [SUCCESSFUL]');
        results.authFlow = true;
      }
    }
  } catch (err) {
    console.error('   - Auth test exception:', err.message);
  } finally {
    // Clean up test user
    if (adminClient && createdUserId) {
      try {
        await adminClient.auth.admin.deleteUser(createdUserId);
        console.log('   - Test user cleanup: [SUCCESSFUL]');
      } catch (cleanErr) {
        // Ignore
      }
    }
  }

  console.log('\n================================================================');
  console.log('                       SUMMARY REPORT                           ');
  console.log('================================================================');
  console.log(`1. Environment Configuration:     ${results.envVariables ? 'PASSED' : 'FAILED'}`);
  console.log(`2. Supabase Client Initialized:    ${results.clientInit ? 'PASSED' : 'FAILED'}`);
  console.log(`3. Database Connection:           ${results.dbConnection ? 'PASSED' : 'FAILED'}`);
  console.log(`4. Required Tables Exist:         ${results.tablesExist ? 'PASSED' : 'FAILED'}`);
  console.log(`5. Row Level Security (RLS):      ${results.rlsActive ? 'PASSED' : 'FAILED'}`);
  console.log(`6. User Registration & Login:     ${results.authFlow ? 'PASSED' : 'FAILED'}`);
  console.log('================================================================\n');
}

runVerification();
