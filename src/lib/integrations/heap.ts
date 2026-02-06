export interface HeapResult {
  success: boolean;
  error: string | null;
}

/**
 * Tracks a "Called by Oscar" event in Heap Analytics.
 */
export async function trackHeapEvent(params: {
  email: string;
}): Promise<HeapResult> {
  const appId = process.env.HEAP_APP_ID || '1012034205';

  try {
    const response = await fetch('https://heapanalytics.com/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: appId,
        identity: params.email,
        event: 'Called by Oscar',
        properties: {
          source: 'UK Screening web_app',
        },
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Heap ${response.status}` };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown Heap error',
    };
  }
}
