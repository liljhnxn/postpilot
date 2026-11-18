import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserScheduledPosts } from '@/lib/services/posts';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduled = await getUserScheduledPosts(supabase, user.id);
    return NextResponse.json({ scheduled });
  } catch (err: any) {
    console.error('Error fetching scheduled posts:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

