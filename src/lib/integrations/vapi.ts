const VAPI_BASE_URL = 'https://api.vapi.ai';
const ASSISTANT_ID = '619752fb-0832-4bf9-a034-fad26824e5d7';
const PHONE_NUMBER_ID = '89335d20-3930-4efa-94da-6e0f4430f145';

export interface VapiCallResult {
  success: boolean;
  callId: string | null;
  createdAt: string | null;
  error: string | null;
  rawResponse: Record<string, unknown> | null;
}

export async function makeVapiCall(params: {
  phone: string;
  firstName: string;
  fullName: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  jobId: string;
  callType: string;
  callNumber: number;
  email: string;
}): Promise<VapiCallResult> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) return { success: false, callId: null, createdAt: null, error: 'VAPI_API_KEY not configured', rawResponse: null };

  try {
    const response = await fetch(`${VAPI_BASE_URL}/call`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: ASSISTANT_ID,
        phoneNumberId: PHONE_NUMBER_ID,
        customer: { number: params.phone },
        assistantOverrides: {
          variableValues: {
            first_name: params.firstName,
            full_name: params.fullName,
            candidate_job_title: params.jobTitle,
            company_name: params.companyName,
            job_title: params.jobTitle,
            chase_stage: String(params.callNumber),
            candidate_id: params.candidateId,
            job_id: params.jobId,
            call_type: params.callType,
            email: params.email,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        callId: null,
        createdAt: null,
        error: `Vapi ${response.status}: ${errorText}`,
        rawResponse: null,
      };
    }

    const data = await response.json();
    return {
      success: true,
      callId: data.id,
      createdAt: data.createdAt,
      error: null,
      rawResponse: data,
    };
  } catch (err) {
    return {
      success: false,
      callId: null,
      createdAt: null,
      error: err instanceof Error ? err.message : 'Unknown Vapi error',
      rawResponse: null,
    };
  }
}
