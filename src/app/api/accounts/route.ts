import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserXAccounts } from '@/lib/services/accounts';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await getUserXAccounts(supabase, user.id);
    return NextResponse.json({ accounts });
  } catch (err: any) {
    console.error('Error fetching accounts:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

