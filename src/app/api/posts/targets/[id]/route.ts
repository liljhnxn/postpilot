import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // 1. Get the post target to identify the parent post_id
    const { data: target, error: targetError } = await supabase
      .from('post_targets')
      .select('id, post_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (targetError || !target) {
      return NextResponse.json({ error: 'Post target not found' }, { status: 404 });
    }

    // 2. Update the parent post content
    const { error: updatePostError } = await supabase
      .from('posts')
      .update({ content: content.trim() })
      .eq('id', target.post_id)
      .eq('user_id', user.id);

    if (updatePostError) {
      return NextResponse.json({ error: updatePostError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating post content:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    // Delete or cancel target
    const { error } = await supabase
      .from('post_targets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting post target:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

