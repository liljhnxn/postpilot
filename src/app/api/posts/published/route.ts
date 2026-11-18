import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPublishedHistory } from '@/lib/services/posts';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filter = (request.nextUrl.searchParams.get('filter') || 'all') as 'all' | 'published' | 'failed';
    const history = await getUserPublishedHistory(supabase, user.id, filter);
    return NextResponse.json({ history });
  } catch (err: any) {
    console.error('Error fetching published history:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

