'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ExecuteButton({
  runId,
  candidateCount,
}: {
  runId: string;
  candidateCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  const handleExecute = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/pipeline/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'execute', runId }),
      });
      router.push(`/runs/${runId}`);
    } catch (err) {
      console.error('Execute failed:', err);
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  if (confirmed) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          Call {candidateCount} candidates?
        </span>
        <Button onClick={handleExecute} disabled={loading} variant="destructive">
          {loading ? 'Starting...' : 'Confirm Execute'}
        </Button>
        <Button onClick={() => setConfirmed(false)} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleExecute} disabled={loading}>
      Execute Calls ({candidateCount})
    </Button>
  );
}
