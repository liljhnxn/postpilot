import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all failed post_targets for this user
    const { data, error } = await supabase
      .from('post_targets')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'failed')
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: data?.length || 0,
    });
  } catch (err: any) {
    console.error('Error clearing failed posts:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

