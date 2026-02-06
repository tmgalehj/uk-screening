'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PipelineConfig } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AuditEntry {
  id: string;
  action: string;
  entity_id: string;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

export function ConfigForm({
  config,
  auditEntries,
}: {
  config: PipelineConfig;
  auditEntries: AuditEntry[];
}) {
  const [formState, setFormState] = useState(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      await fetch('/api/pipeline/fetch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof PipelineConfig, value: unknown) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Gates */}
      <Card>
        <CardHeader>
          <CardTitle>Gates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Compliance gate (opt-out check)</Label>
            <Switch
              checked={formState.gates_enabled.compliance}
              onCheckedChange={(checked) =>
                updateField('gates_enabled', {
                  ...formState.gates_enabled,
                  compliance: checked,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label>Buffer gate</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={formState.buffer_hours}
                  onChange={(e) =>
                    updateField('buffer_hours', parseInt(e.target.value) || 0)
                  }
                  className="w-20"
                />
                <span className="text-sm text-gray-500">hours</span>
              </div>
            </div>
            <Switch
              checked={formState.gates_enabled.buffer}
              onCheckedChange={(checked) =>
                updateField('gates_enabled', {
                  ...formState.gates_enabled,
                  buffer: checked,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label>Volume gate</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">max</span>
                <Input
                  type="number"
                  value={formState.max_monthly_calls}
                  onChange={(e) =>
                    updateField('max_monthly_calls', parseInt(e.target.value) || 0)
                  }
                  className="w-20"
                />
                <span className="text-sm text-gray-500">calls / 30 days</span>
              </div>
            </div>
            <Switch
              checked={formState.gates_enabled.volume}
              onCheckedChange={(checked) =>
                updateField('gates_enabled', {
                  ...formState.gates_enabled,
                  volume: checked,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Job Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Job Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="w-40">Min job age</Label>
            <Input
              type="number"
              value={formState.job_age_minimum_hours}
              onChange={(e) =>
                updateField('job_age_minimum_hours', parseInt(e.target.value) || 0)
              }
              className="w-20"
            />
            <span className="text-sm text-gray-500">hours</span>
          </div>
          <div className="flex items-center gap-3">
            <Label className="w-40">Max calls per job</Label>
            <Input
              type="number"
              value={formState.max_calls_per_job}
              onChange={(e) =>
                updateField('max_calls_per_job', parseInt(e.target.value) || 0)
              }
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="w-40">Chase interval</Label>
            <Input
              type="number"
              value={formState.chase_interval_days}
              onChange={(e) =>
                updateField('chase_interval_days', parseInt(e.target.value) || 0)
              }
              className="w-20"
            />
            <span className="text-sm text-gray-500">days</span>
          </div>
        </CardContent>
      </Card>

      {/* Scoring */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="w-48">Screening stage bonus</Label>
            <Input
              type="number"
              value={formState.screening_stage_bonus}
              onChange={(e) =>
                updateField('screening_stage_bonus', parseInt(e.target.value) || 0)
              }
              className="w-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quota */}
      <Card>
        <CardHeader>
          <CardTitle>Quota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="w-40">Daily limit</Label>
            <Input
              type="number"
              value={formState.daily_quota}
              onChange={(e) =>
                updateField('daily_quota', parseInt(e.target.value) || 0)
              }
              className="w-24"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>Company limits</Label>
            <Switch
              checked={formState.company_limits.enabled}
              onCheckedChange={(checked) =>
                updateField('company_limits', {
                  ...formState.company_limits,
                  enabled: checked,
                })
              }
            />
          </div>
          {formState.company_limits.enabled && (
            <div className="flex items-center gap-3">
              <Label className="w-40">Max per company</Label>
              <Input
                type="number"
                value={formState.company_limits.max_per_company}
                onChange={(e) =>
                  updateField('company_limits', {
                    ...formState.company_limits,
                    max_per_company: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved successfully</span>}
      </div>

      {/* Change history */}
      {auditEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Change History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Field</th>
                    <th className="py-2 pr-4">Old Value</th>
                    <th className="py-2">New Value</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-gray-500">
                        {new Date(entry.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 pr-4 font-mono">{entry.entity_id}</td>
                      <td className="py-2 pr-4 text-gray-500">
                        {JSON.stringify(entry.old_value)}
                      </td>
                      <td className="py-2">{JSON.stringify(entry.new_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
