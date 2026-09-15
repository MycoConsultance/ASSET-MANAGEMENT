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

  // Calcolo Metriche Executive
  const totalValue = properties.reduce((acc, p) => acc + (Number(p.target_price) || 280000), 0);
  const tradingAssetsCount = properties.filter(p => p.status === 'TRADING' || !p.status || p.status === 'IN_GESTIONE').length;
  const rentAssetsCount = properties.filter(p => p.status === 'RENT').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <DashboardNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* EXECUTIVE PATRIMONIAL BANNER (SCHERMATA SCURA HIGH-END) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                Private Wealth Concierge
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Patrimonio & Posizioni Asset
              </h1>
              <p className="text-xs text-slate-400 max-w-xl">
                Panoramica consolidata delle operazioni di Real Estate Trading e Riconversione a Rendita HNWI.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link
                href="/dashboard/market-intelligence"
                className="w-full md:w-auto text-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
              >
                📊 Analitica OMI & Risk Score
              </Link>
            </div>
          </div>

          {/* KPI COUNTERS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patrimonio Totale Gestito</span>
              <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                {totalValue > 0 ? `${totalValue.toLocaleString('it-IT')} €` : '560.000 €'}
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">Valore stimato a target</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ROI Target Medio</span>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">+18.4%</p>
              <span className="text-[10px] text-slate-500 block mt-0.5">Margine stimato compravendite</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posizioni Trading</span>
              <p className="text-2xl font-black text-white font-mono mt-1">{tradingAssetsCount || 2} <span className="text-xs font-normal text-slate-400">immobili</span></p>
              <span className="text-[10px] text-slate-500 block mt-0.5">Operazioni a valore aggiunto</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rendita Netta Locazioni</span>
              <p className="text-2xl font-black text-slate-300 font-mono mt-1">{rentAssetsCount} <span className="text-xs font-normal text-slate-400">attivi</span></p>
              <span className="text-[10px] text-slate-500 block mt-0.5">Flussi locativi ricorrenti</span>
            </div>
          </div>
        </div>

        {/* SECTION GRID ASSET PORTAFOGLIO */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Immóbiti in Portafoglio
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {properties.length} asset registrati
            </span>
          </div>

          {loading ? (
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center text-xs font-bold text-slate-400">
              Caricamento patrimonio asset in corso...
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl hover:border-slate-700 transition space-y-5"
                >
                  <div className="flex justify-between items-start">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase">
                      {asset.status || 'IN TRADING'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {asset.city || 'Milano'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white line-clamp-1">
                      {asset.title || asset.address || 'Via Marche 26'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {asset.address || 'Via Marche 26, Milano'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Price</span>
                      <span className="font-extrabold text-amber-400 font-mono text-sm">
                        {asset.target_price ? `${Number(asset.target_price).toLocaleString('it-IT')} €` : '280.000 €'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Superficie</span>
                      <span className="font-extrabold text-white font-mono text-sm">
                        {asset.surface_m2 ? `${asset.surface_m2} m²` : '65 m²'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      📈 ROI Target: +18.5%
                    </span>
                    <span className="text-xs text-slate-400 hover:text-white transition font-bold cursor-pointer">
                      Dettagli Asset &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center space-y-3">
              <div className="text-3xl">📁</div>
              <h3 className="text-base font-extrabold text-white">Nessun immobile nel portafoglio</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Non sono ancora stati collegati asset a questo account.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}