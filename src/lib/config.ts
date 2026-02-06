import { SupabaseClient } from '@supabase/supabase-js';
import { PipelineConfig, DEFAULT_CONFIG } from './types';

/**
 * Loads pipeline config from Supabase pipeline_config table.
 * Falls back to defaults for any missing keys.
 */
export async function loadConfig(supabase: SupabaseClient): Promise<PipelineConfig> {
  const { data, error } = await supabase
    .from('pipeline_config')
    .select('key, value');

  if (error) {
    console.error('Failed to load config, using defaults:', error.message);
    return DEFAULT_CONFIG;
  }

  const config = { ...DEFAULT_CONFIG };

  for (const row of data || []) {
    const key = row.key as keyof PipelineConfig;
    if (key in config) {
      // JSONB values come back as parsed objects/primitives
      (config as Record<string, unknown>)[key] = row.value;
    }
  }

  return config;
}

/**
 * Updates a single config key and logs the change.
 */
export async function updateConfig(
  supabase: SupabaseClient,
  key: string,
  value: unknown,
  userId?: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('pipeline_config')
    .select('value')
    .eq('key', key)
    .single();

  const { error } = await supabase
    .from('pipeline_config')
    .upsert({
      key,
      value,
      updated_by: userId || null,
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(`Failed to update config ${key}: ${error.message}`);

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: userId || null,
    action: 'config_change',
    entity_type: 'pipeline_config',
    entity_id: key,
    old_value: existing?.value ?? null,
    new_value: value,
  });
}
