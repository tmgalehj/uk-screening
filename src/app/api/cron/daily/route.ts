import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRun, runFullPipeline } from '@/lib/pipeline/orchestrator';

export const maxDuration = 300; // 5 minutes (Vercel Pro)

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const runId = await createRun(supabase, 'scheduled');
    // Run full pipeline (prepare + execute) for scheduled runs
    await runFullPipeline(supabase, runId);
    return NextResponse.json({ runId, status: 'completed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
