import { createServerSupabase } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PipelineRun, RunStats } from '@/lib/types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'executing': return 'bg-blue-100 text-blue-800';
    case 'processing': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default async function RunsPage() {
  const supabase = await createServerSupabase();

  const { data: runs } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const allRuns = (runs || []) as PipelineRun[];

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Run History</h1>

        <Card>
          <CardHeader>
            <CardTitle>All Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {allRuns.length === 0 ? (
              <p className="text-sm text-gray-500">No runs yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Trigger</th>
                      <th className="py-2 pr-4">Fetched</th>
                      <th className="py-2 pr-4">Gates Passed</th>
                      <th className="py-2 pr-4">Selected</th>
                      <th className="py-2 pr-4">Called</th>
                      <th className="py-2 pr-4">Errors</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRuns.map((run) => {
                      const stats = run.stats as RunStats;
                      return (
                        <tr key={run.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <Link
                              href={`/runs/${run.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {formatDate(run.created_at)}
                            </Link>
                          </td>
                          <td className="py-2 pr-4 capitalize">{run.trigger_type}</td>
                          <td className="py-2 pr-4">{stats?.total_fetched || '--'}</td>
                          <td className="py-2 pr-4">{stats?.total_passed_gates || '--'}</td>
                          <td className="py-2 pr-4">{stats?.total_selected || '--'}</td>
                          <td className="py-2 pr-4">{stats?.total_called || '--'}</td>
                          <td className="py-2 pr-4">{stats?.total_errors || 0}</td>
                          <td className="py-2">
                            <Badge className={statusColor(run.status)} variant="secondary">
                              {run.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
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
