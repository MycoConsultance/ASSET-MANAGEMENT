'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DashboardNavbar() {
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
        
        {/* LOGO PLATFORM */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg tracking-wider group-hover:bg-amber-400 transition">
            MYCO
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-100">
            Asset Management & Intelligence
          </span>
        </Link>

        {/* NAVIGATION LINKS & LOGOUT */}
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            📁 Portafoglio Asset
          </Link>

          <Link
            href="/dashboard/market-intelligence"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            📊 Market Intelligence
          </Link>

          <Link
            href="/admin/omi-sync"
            className="text-xs font-bold text-slate-400 hover:text-slate-200 transition hidden sm:inline-block"
          >
            ⚙️ Pannello Admin
          </Link>

          {/* BOTTONE LOGOUT */}
          <button
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-3 py-2 rounded-xl transition ml-2 flex items-center gap-1.5 cursor-pointer"
          >
            🚪 Logout
          </button>
        </nav>

      </div>
    </header>
  );
}