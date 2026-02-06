import { createServerSupabase } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PipelineCandidate, PipelineRun, RunStats } from '@/lib/types';
import { PipelineCandidateTable } from '@/components/pipeline/CandidateTable';
import { ExecuteButton } from '@/components/pipeline/ExecuteButton';

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ runId?: string }>;
}) {
  const { runId } = await searchParams;
  const supabase = await createServerSupabase();

  // Get the latest prepared run (or the one specified)
  let run: PipelineRun | null = null;

  if (runId) {
    const { data } = await supabase
      .from('pipeline_runs')
      .select('*')
      .eq('id', runId)
      .single();
    run = data as PipelineRun | null;
  } else {
    // Get the most recent processing/pending run
    const { data } = await supabase
      .from('pipeline_runs')
      .select('*')
      .in('status', ['processing', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    run = data as PipelineRun | null;
  }

  if (!run) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Review</h1>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">
                No prepared run available. Use &quot;Preview Run&quot; from the Dashboard to prepare a batch for review.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const stats = run.stats as RunStats;

  // Fetch all candidates for this run
  const { data: candidates } = await supabase
    .from('pipeline_candidates')
    .select('*')
    .eq('run_id', run.id)
    .order('priority_score', { ascending: false })
    .limit(1000);

  const allCandidates = (candidates || []) as PipelineCandidate[];
  const passedGates = allCandidates.filter((c) => c.gates_passed);
  const selected = allCandidates.filter(
    (c) => c.phone_valid && c.selected_job_id && !c.manually_excluded
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Review</h1>
            <p className="text-sm text-gray-500 mt-1">
              {selected.length} candidates selected of {allCandidates.length} total
            </p>
          </div>
          {run.status === 'processing' && (
            <ExecuteButton runId={run.id} candidateCount={selected.length} />
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold">{allCandidates.length}</div>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-green-600">{passedGates.length}</div>
              <p className="text-xs text-gray-500">Passed Gates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {allCandidates.length - passedGates.length}
              </div>
              <p className="text-xs text-gray-500">Blocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold">{stats?.total_phone_valid || selected.length}</div>
              <p className="text-xs text-gray-500">Valid Phone</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{selected.length}</div>
              <p className="text-xs text-gray-500">To Call</p>
            </CardContent>
          </Card>
        </div>

        {/* Candidate table */}
        <PipelineCandidateTable candidates={allCandidates} runId={run.id} />
      </div>
    </AppShell>
  );
}
