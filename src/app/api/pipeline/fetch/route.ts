import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { updateConfig } from '@/lib/config';
import { PipelineConfig } from '@/lib/types';

// PUT: Update pipeline configuration
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const newConfig = (await request.json()) as PipelineConfig;

  try {
    // Update each config key
    const keys = Object.keys(newConfig) as (keyof PipelineConfig)[];
    for (const key of keys) {
      await updateConfig(supabase, key, newConfig[key], user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
