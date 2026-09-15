'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardNavbar from '@/components/DashboardNavbar';
import Link from 'next/link';

export default function DashboardPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Errore caricamento asset:', error);
        } else if (data) {
          setProperties(data);
        }
      } catch (err) {
        console.error('Errore di connessione:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <DashboardNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* HEADER TOP BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Portafoglio Asset Immobiliare
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestione riservata delle posizioni di investimento e cantieri attivi
            </p>
          </div>

          <Link
            href="/dashboard/market-intelligence"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
          >
            📊 Market Intelligence OMI
          </Link>
        </div>

        {/* LISTA DEGLI ASSET */}
        {loading ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs font-bold text-slate-400">
            Caricamento portafoglio asset in corso...
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex justify-between items-start">
                  <span className="bg-slate-100 text-slate-800 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase">
                    {asset.status || 'In Gestione'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {asset.city}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
                    {asset.title || asset.address || 'Immobile senza titolo'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {asset.address}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Valore Stimato</span>
                    <span className="font-extrabold text-slate-900 font-mono">
                      {asset.target_price ? `${Number(asset.target_price).toLocaleString('it-IT')} €` : 'N/D'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Superficie</span>
                    <span className="font-extrabold text-slate-900 font-mono">
                      {asset.surface_m2 ? `${asset.surface_m2} m²` : 'N/D'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="text-3xl">📁</div>
            <h3 className="text-base font-extrabold text-slate-900">Nessun immobile nel portafoglio</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Non sono ancora stati collegati asset a questo account oppure gli immobili sono in fase di accreditamento notarile.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}