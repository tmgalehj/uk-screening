export interface SlackResult {
  success: boolean;
  error: string | null;
}

/**
 * Sends a message to the configured Slack channel.
 */
export async function sendSlackMessage(text: string): Promise<SlackResult> {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID || 'C093TL420AH';

  if (!token) {
    console.warn('SLACK_BOT_TOKEN not configured, skipping notification');
    return { success: false, error: 'SLACK_BOT_TOKEN not configured' };
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text }),
    });

    const data = await response.json();
    if (!data.ok) {
      return { success: false, error: `Slack error: ${data.error}` };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown Slack error',
    };
  }
}

export function formatRunStartMessage(): string {
  return '<!here> UK Screening Call run starting';
}

export function formatRunCompleteMessage(stats: {
  totalCalled: number;
  totalErrors: number;
}): string {
  return `<!here> UK Screening Call run completed\n\n:tada: *Daily Voice Campaign Complete*\n:phone: *Calls made:* ${stats.totalCalled}\n${stats.totalErrors > 0 ? `:warning: *Errors:* ${stats.totalErrors}` : ''}`;
}

export function formatErrorMessage(candidateName: string, error: string): string {
  return `<!here> UK Vapi Error for ${candidateName}: ${error}`;
}
