import { createServerSupabase } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PipelineRun, PipelineCandidate, RunStats } from '@/lib/types';
import Link from 'next/link';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function statusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'error': return 'bg-red-100 text-red-800';
    case 'calling': return 'bg-blue-100 text-blue-800';
    case 'skipped': return 'bg-gray-100 text-gray-600';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

function integrationBadge(success: boolean | null) {
  if (success === true) return <Badge className="bg-green-100 text-green-800" variant="secondary">OK</Badge>;
  if (success === false) return <Badge className="bg-red-100 text-red-800" variant="secondary">Fail</Badge>;
  return <span className="text-gray-400">--</span>;
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const supabase = await createServerSupabase();

  // Fetch run
  const { data: run } = await supabase
    .from('pipeline_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (!run) {
    return (
      <AppShell>
        <p>Run not found.</p>
      </AppShell>
    );
  }

  const pipelineRun = run as PipelineRun;
  const stats = pipelineRun.stats as RunStats;

  // Fetch candidates for this run (executed ones first)
  const { data: candidates } = await supabase
    .from('pipeline_candidates')
    .select('*')
    .eq('run_id', runId)
    .order('priority_score', { ascending: false })
    .limit(500);

  const allCandidates = (candidates || []) as PipelineCandidate[];
  const executedCandidates = allCandidates.filter(
    (c) => c.execution_status === 'completed' || c.execution_status === 'error'
  );

  // Timeline steps
  const steps = [
    { label: 'Fetch', time: pipelineRun.started_at, done: true },
    {
      label: 'Process',
      time: pipelineRun.started_at,
      done: ['processing', 'executing', 'completed'].includes(pipelineRun.status),
    },
    {
      label: 'Execute',
      time: null,
      done: ['executing', 'completed'].includes(pipelineRun.status),
    },
    {
      label: 'Complete',
      time: pipelineRun.completed_at,
      done: pipelineRun.status === 'completed',
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/runs" className="text-blue-600 hover:underline text-sm">
            &larr; All runs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Run Detail
          </h1>
          <Badge className={statusColor(pipelineRun.status)} variant="secondary">
            {pipelineRun.status}
          </Badge>
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <div className="text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.done
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step.done ? '\u2713' : i + 1}
                    </div>
                    <p className="text-xs mt-1 font-medium">{step.label}</p>
                    <p className="text-xs text-gray-400">
                      {step.time ? formatDate(step.time) : ''}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-16 mx-2 ${
                        steps[i + 1].done ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'Fetched', value: stats?.total_fetched },
            { label: 'Passed Gates', value: stats?.total_passed_gates },
            { label: 'Phone Valid', value: stats?.total_phone_valid },
            { label: 'Selected', value: stats?.total_selected },
            { label: 'Called', value: stats?.total_called },
            { label: 'Errors', value: stats?.total_errors },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{stat.value ?? '--'}</div>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error message */}
        {pipelineRun.error_message && (
          <Card className="border-red-200">
            <CardContent className="pt-4">
              <p className="text-sm text-red-600">{pipelineRun.error_message}</p>
            </CardContent>
          </Card>
        )}

        {/* Execution log */}
        <Card>
          <CardHeader>
            <CardTitle>
              Execution Log ({executedCandidates.length} candidates)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {executedCandidates.length === 0 ? (
              <p className="text-sm text-gray-500">No candidates executed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4">#</th>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Job</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Vapi</th>
                      <th className="py-2 pr-4">WhatsApp</th>
                      <th className="py-2 pr-4">AC</th>
                      <th className="py-2 pr-4">Heap</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executedCandidates.map((c, i) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                        <td className="py-2 pr-4 font-medium">{c.full_name}</td>
                        <td className="py-2 pr-4">
                          {c.selected_job_title}
                          {c.selected_company && (
                            <span className="text-gray-400"> @ {c.selected_company}</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 capitalize">{c.call_type || '--'}</td>
                        <td className="py-2 pr-4">
                          {c.vapi_call_id ? integrationBadge(true) : integrationBadge(c.execution_status === 'error' ? false : null)}
                        </td>
                        <td className="py-2 pr-4">{integrationBadge(c.whatsapp_sent || null)}</td>
                        <td className="py-2 pr-4">{integrationBadge(c.activecampaign_synced || null)}</td>
                        <td className="py-2 pr-4">{integrationBadge(c.heap_tracked || null)}</td>
                        <td className="py-2">
                          <Badge className={statusColor(c.execution_status)} variant="secondary">
                            {c.execution_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
