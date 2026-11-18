import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { disconnectXAccount } from '@/lib/services/accounts';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const result = await disconnectXAccount(supabase, user.id, id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to disconnect account' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Account disconnected successfully' });
  } catch (err: any) {
    console.error('Error disconnecting account:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

