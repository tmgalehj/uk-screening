export interface ActiveCampaignResult {
  success: boolean;
  contactId: string | null;
  error: string | null;
}

/**
 * Upserts a contact in ActiveCampaign with job_title and company_name fields,
 * then adds them to list 365.
 */
export async function syncToActiveCampaign(params: {
  email: string;
  jobTitle: string;
  companyName: string;
}): Promise<ActiveCampaignResult> {
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL;
  const apiKey = process.env.ACTIVECAMPAIGN_API_KEY;

  if (!apiUrl || !apiKey) {
    return { success: false, contactId: null, error: 'ActiveCampaign not configured' };
  }

  try {
    // Step 1: Create or update contact
    const syncResponse = await fetch(`${apiUrl}/api/3/contact/sync`, {
      method: 'POST',
      headers: {
        'Api-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact: {
          email: params.email,
          fieldValues: [
            { field: '755', value: params.jobTitle },
            { field: '756', value: params.companyName },
          ],
        },
      }),
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      return { success: false, contactId: null, error: `AC sync ${syncResponse.status}: ${errorText}` };
    }

    const syncData = await syncResponse.json();
    const contactId = syncData.contact?.id;

    if (!contactId) {
      return { success: false, contactId: null, error: 'No contact ID returned from AC' };
    }

    // Step 2: Add to list 365
    const listResponse = await fetch(`${apiUrl}/api/3/contactLists`, {
      method: 'POST',
      headers: {
        'Api-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactList: {
          list: 365,
          contact: contactId,
          status: 1, // subscribed
        },
      }),
    });

    if (!listResponse.ok) {
      // Non-fatal — contact was created, just couldn't add to list
      console.warn(`AC list add failed: ${listResponse.status}`);
    }

    return { success: true, contactId, error: null };
  } catch (err) {
    return {
      success: false,
      contactId: null,
      error: err instanceof Error ? err.message : 'Unknown ActiveCampaign error',
    };
  }
}
