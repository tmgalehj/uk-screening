import { createServerSupabase } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PipelineRun, RunStats } from '@/lib/types';
import { TriggerButton } from '@/components/dashboard/TriggerButton';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
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

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  // Fetch recent runs
  const { data: runs } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const recentRuns = (runs || []) as PipelineRun[];

  // Calculate stats for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayRuns = recentRuns.filter(
    (r) => new Date(r.created_at) >= todayStart
  );

  const todayCalls = todayRuns.reduce(
    (sum, r) => sum + ((r.stats as RunStats)?.total_called || 0),
    0
  );
  const todayErrors = todayRuns.reduce(
    (sum, r) => sum + ((r.stats as RunStats)?.total_errors || 0),
    0
  );

  // This week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekRuns = recentRuns.filter(
    (r) => new Date(r.created_at) >= weekStart
  );
  const weekCalls = weekRuns.reduce(
    (sum, r) => sum + ((r.stats as RunStats)?.total_called || 0),
    0
  );

  const successRate =
    todayCalls > 0
      ? Math.round(((todayCalls - todayErrors) / todayCalls) * 100)
      : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <TriggerButton />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayCalls}</div>
              <p className="text-xs text-gray-500">
                calls made{todayErrors > 0 ? ` (${todayErrors} errors)` : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{weekCalls}</div>
              <p className="text-xs text-gray-500">
                calls across {weekRuns.length} runs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {todayCalls > 0 ? `${successRate}%` : '--'}
              </div>
              <p className="text-xs text-gray-500">today&apos;s calls</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent runs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRuns.length === 0 ? (
              <p className="text-sm text-gray-500">No runs yet. Trigger one to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Trigger</th>
                      <th className="py-2 pr-4">Fetched</th>
                      <th className="py-2 pr-4">Called</th>
                      <th className="py-2 pr-4">Errors</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRuns.map((run) => {
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
                          <td className="py-2 pr-4 capitalize">
                            {run.trigger_type}
                          </td>
                          <td className="py-2 pr-4">
                            {stats?.total_fetched || '--'}
                          </td>
                          <td className="py-2 pr-4">
                            {stats?.total_called || '--'}
                          </td>
                          <td className="py-2 pr-4">
                            {stats?.total_errors || 0}
                          </td>
                          <td className="py-2">
                            <Badge
                              className={statusColor(run.status)}
                              variant="secondary"
                            >
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
