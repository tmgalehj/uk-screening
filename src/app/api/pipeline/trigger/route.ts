import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRun, preparePipeline, executePipeline, runFullPipeline } from '@/lib/pipeline/orchestrator';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const mode = body.mode || 'prepare'; // 'prepare' | 'execute' | 'full'
  const adminClient = createAdminClient();

  try {
    if (mode === 'execute') {
      // Execute an existing prepared run
      const runId = body.runId;
      if (!runId) {
        return NextResponse.json({ error: 'runId required for execute mode' }, { status: 400 });
      }
      await executePipeline(adminClient, runId);
      return NextResponse.json({ runId, status: 'executing' });
    }

    // Create a new run
    const runId = await createRun(adminClient, 'manual', user.id);

    if (mode === 'full') {
      // Run prepare + execute in one go
      await runFullPipeline(adminClient, runId);
      return NextResponse.json({ runId, status: 'completed' });
    }

    // Default: prepare only (for manual review before execution)
    await preparePipeline(adminClient, runId);
    return NextResponse.json({ runId, status: 'prepared' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
