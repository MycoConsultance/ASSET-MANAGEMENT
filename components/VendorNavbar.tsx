'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function VendorNavbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg tracking-wider">
            MYCO
          </div>
          <span className="font-bold text-xs sm:text-sm text-slate-300">
            Partner B2B Workspace
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            🔒 Area Segregata Partner
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            🚪 Logout
          </button>
        </div>

      </div>
    </header>
  );
}