'use client';

import { Fragment, useState } from 'react';
import { PipelineCandidate, ScoreBreakdown } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Filter = 'all' | 'passed' | 'blocked' | 'selected';

function GateBadge({ passed, label }: { passed: boolean | null; label: string }) {
  if (passed === true) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700" title={`${label}: passed`}>
        P
      </span>
    );
  }
  if (passed === false) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700" title={`${label}: failed`}>
        F
      </span>
    );
  }
  return <span className="text-gray-300">--</span>;
}

function CandidateDetailRow({ candidate }: { candidate: PipelineCandidate }) {
  const details = candidate.gate_details;
  const score = candidate.score_breakdown as ScoreBreakdown | null;

  return (
    <tr>
      <td colSpan={7} className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* Gate details */}
          <div>
            <h4 className="font-medium mb-2">Gate Details</h4>
            {details ? (
              <ul className="space-y-1 text-gray-600">
                <li>Opt-out: {String(details.opt_out_status)}</li>
                <li>
                  Last call:{' '}
                  {details.last_call_at
                    ? `${Math.round(details.hours_since_last_call || 0)}h ago`
                    : 'Never'}
                </li>
                <li>Calls in 30d: {details.calls_in_30d}</li>
                {details.failure_reasons?.length > 0 && (
                  <li className="text-red-600">
                    Blocked: {details.failure_reasons.join(', ')}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-gray-400">No gate data</p>
            )}
          </div>

          {/* Job selection */}
          <div>
            <h4 className="font-medium mb-2">Job Selection</h4>
            {candidate.selected_job_id ? (
              <ul className="space-y-1 text-gray-600">
                <li>Job: {candidate.selected_job_title}</li>
                <li>Company: {candidate.selected_company}</li>
                <li>Reason: {candidate.job_selection_reason}</li>
                <li>Call #{candidate.call_number} ({candidate.call_type})</li>
              </ul>
            ) : (
              <p className="text-gray-400">No job selected</p>
            )}
          </div>

          {/* Score breakdown */}
          <div>
            <h4 className="font-medium mb-2">Score Breakdown</h4>
            {score ? (
              <ul className="space-y-1 text-gray-600">
                <li>Stage bonus: +{score.stage_bonus}</li>
                <li>Call type: +{score.type_bonus}</li>
                <li>Freshness: +{score.freshness_bonus}</li>
                <li>Initial bonus: +{score.initial_bonus}</li>
                <li className="font-medium">Total: {candidate.priority_score}</li>
              </ul>
            ) : (
              <p className="text-gray-400">No score</p>
            )}
          </div>
        </div>

        {/* Phone + contact */}
        <div className="mt-3 text-sm text-gray-500">
          Phone: {candidate.phone_formatted || candidate.phone || '--'}{' '}
          {candidate.phone_valid === false && (
            <span className="text-red-500">({candidate.phone_validation_reason})</span>
          )}
          {' | '}
          Email: {candidate.email || '--'}
        </div>
      </td>
    </tr>
  );
}

export function PipelineCandidateTable({
  candidates,
  runId,
}: {
  candidates: PipelineCandidate[];
  runId: string;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = candidates.filter((c) => {
    // Search filter
    if (search) {
      const term = search.toLowerCase();
      const matchesSearch =
        c.full_name?.toLowerCase().includes(term) ||
        c.candidate_id?.toLowerCase().includes(term) ||
        c.selected_job_title?.toLowerCase().includes(term) ||
        c.selected_company?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Status filter
    switch (filter) {
      case 'passed':
        return c.gates_passed;
      case 'blocked':
        return !c.gates_passed;
      case 'selected':
        return c.phone_valid && c.selected_job_id && !c.manually_excluded;
      default:
        return true;
    }
  });

  const handleOverride = async (candidateId: string, action: 'include' | 'exclude') => {
    try {
      await fetch('/api/pipeline/process', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, action, runId }),
      });
      // Reload to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Override failed:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Candidates ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {(['all', 'passed', 'blocked', 'selected'] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">Gates</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <Fragment key={c.id}>
                  <tr
                    className={`border-b last:border-0 cursor-pointer hover:bg-gray-50 ${
                      c.manually_excluded ? 'opacity-50' : ''
                    } ${c.manually_included ? 'bg-blue-50' : ''}`}
                    onClick={() =>
                      setExpandedId(expandedId === c.id ? null : c.id)
                    }
                  >
                    <td className="py-2 pr-4">
                      <div className="font-medium">{c.full_name}</div>
                      <div className="text-xs text-gray-400">{c.candidate_id}</div>
                    </td>
                    <td className="py-2 pr-4">
                      {c.selected_job_title ? (
                        <div>
                          <div>{c.selected_job_title}</div>
                          <div className="text-xs text-gray-400">
                            {c.selected_company}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-1">
                        <GateBadge passed={c.gate_compliance} label="Compliance" />
                        <GateBadge passed={c.gate_buffer} label="Buffer" />
                        <GateBadge passed={c.gate_volume} label="Volume" />
                      </div>
                    </td>
                    <td className="py-2 pr-4 font-mono">
                      {c.priority_score > 0 ? c.priority_score : '--'}
                    </td>
                    <td className="py-2 pr-4 capitalize">
                      {c.call_type || '--'}
                    </td>
                    <td className="py-2 pr-4">
                      {c.phone_valid ? (
                        <Badge className="bg-green-100 text-green-700" variant="secondary">
                          Valid
                        </Badge>
                      ) : c.phone_valid === false ? (
                        <Badge className="bg-red-100 text-red-700" variant="secondary">
                          Invalid
                        </Badge>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!c.gates_passed && !c.manually_included && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 text-xs h-7"
                            onClick={() => handleOverride(c.id, 'include')}
                            title="Force include"
                          >
                            +Include
                          </Button>
                        )}
                        {(c.gates_passed || c.manually_included) && !c.manually_excluded && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 text-xs h-7"
                            onClick={() => handleOverride(c.id, 'exclude')}
                            title="Exclude"
                          >
                            -Exclude
                          </Button>
                        )}
                        {c.manually_excluded && (
                          <Badge variant="secondary" className="bg-red-50 text-red-600">
                            Excluded
                          </Badge>
                        )}
                        {c.manually_included && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                            Included
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <CandidateDetailRow key={`${c.id}-detail`} candidate={c} />
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
