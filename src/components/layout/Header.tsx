'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Header() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-end px-6">
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  );
}
