'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNavbar() {
  const pathname = usePathname();

  const navItems = [
    { label: '📁 Portafoglio Asset', href: '/dashboard/properties' },
    { label: '📊 Market Intelligence', href: '/dashboard/market-intelligence' },
    { label: '⚙️ Pannello Staff', href: '/admin/ancillary-costs' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        
        {/* LOGO BRAND */}
        <Link href="/dashboard/properties" className="flex items-center gap-2">
          <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider">
            MYCO
          </span>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            Asset Management & Intelligence
          </span>
        </Link>

        {/* MENU DI NAVIGAZIONE GLOBALE */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}