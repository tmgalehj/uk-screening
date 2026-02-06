import { RawCandidate } from '../types';

interface TrevorResponse {
  headings: { name: string }[];
  rows: { cells: (string | number | boolean | null)[] }[];
}

/**
 * Fetches open candidate requests from Trevor.io JSON report.
 * Parses the headings + rows format into typed candidate objects.
 */
export async function fetchCandidates(): Promise<RawCandidate[]> {
  const url = process.env.TREVOR_REPORT_URL;
  if (!url) throw new Error('TREVOR_REPORT_URL not configured');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Trevor.io fetch failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  // Trevor.io returns { data: "stringified JSON" }
  let parsed: TrevorResponse;
  if (typeof json.data === 'string') {
    parsed = JSON.parse(json.data);
  } else {
    parsed = json;
  }

  const headers = parsed.headings.map((h) => h.name);

  return parsed.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      obj[h] = row.cells[i] ?? null;
    });
    return obj as unknown as RawCandidate;
  });
}
