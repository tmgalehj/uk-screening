import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { candidateId, action, runId } = body;

  if (!candidateId || !action) {
    return NextResponse.json({ error: 'candidateId and action required' }, { status: 400 });
  }

  const update =
    action === 'include'
      ? { manually_included: true, manually_excluded: false, override_by: user.id }
      : { manually_excluded: true, manually_included: false, override_by: user.id };

  const { error } = await supabase
    .from('pipeline_candidates')
    .update(update)
    .eq('id', candidateId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: `manual_${action}`,
    entity_type: 'pipeline_candidate',
    entity_id: candidateId,
    new_value: { action, runId },
  });

  return NextResponse.json({ success: true });
}
