const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export interface WhatsAppResult {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

/**
 * Sends the screening_request WhatsApp template to a candidate.
 * Only sent for initial calls (not chase calls).
 */
export async function sendWhatsAppTemplate(params: {
  phone: string;
  firstName: string;
  companyName: string;
  jobTitle: string;
}): Promise<WhatsAppResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '845073342028648';

  if (!accessToken) {
    return { success: false, messageId: null, error: 'WHATSAPP_ACCESS_TOKEN not configured' };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: params.phone.replace('+', ''),
          type: 'template',
          template: {
            name: 'screening_request',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: params.firstName },
                  { type: 'text', text: params.companyName },
                  { type: 'text', text: params.jobTitle },
                ],
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, messageId: null, error: `WhatsApp ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id || null,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      messageId: null,
      error: err instanceof Error ? err.message : 'Unknown WhatsApp error',
    };
  }
}
