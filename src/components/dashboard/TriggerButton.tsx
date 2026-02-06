'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function TriggerButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleTrigger = async (mode: 'prepare' | 'full') => {
    setLoading(true);
    try {
      const res = await fetch('/api/pipeline/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const data = await res.json();
      if (data.runId) {
        if (mode === 'prepare') {
          router.push(`/pipeline?runId=${data.runId}`);
        } else {
          router.push(`/runs/${data.runId}`);
        }
      }
    } catch (err) {
      console.error('Trigger failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleTrigger('prepare')}
        disabled={loading}
        variant="default"
      >
        {loading ? 'Running...' : 'Preview Run'}
      </Button>
      <Button
        onClick={() => handleTrigger('full')}
        disabled={loading}
        variant="outline"
      >
        Run Now
      </Button>
    </div>
  );
}
