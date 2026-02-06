import { createServerSupabase } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { loadConfig } from '@/lib/config';
import { ConfigForm } from '@/components/config/ConfigForm';

export default async function ConfigPage() {
  const supabase = await createServerSupabase();
  const config = await loadConfig(supabase);

  // Fetch recent audit log entries for config changes
  const { data: auditEntries } = await supabase
    .from('audit_log')
    .select('*')
    .eq('action', 'config_change')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <ConfigForm config={config} auditEntries={auditEntries || []} />
      </div>
    </AppShell>
  );
}
