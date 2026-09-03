'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';

export default function PropertiesDashboardPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      if (data) setProperties(data);
      setLoading(false);
    }
    fetchProperties();
  }, [supabase]);

  // CALCOLO METRICHE GLOBALI DEL PORTAFOGLIO MULTI-ASSET
  const totalInvested = properties.reduce((acc, p) => acc + Number(p.price || 0), 0);
  const totalGrossRent = properties.reduce((acc, p) => acc + (Number(p.monthly_rent || 0) * 12), 0);
  const totalNetRent = properties.reduce((acc, p) => {
    const gross = Number(p.monthly_rent || 0) * 12;
    const fees = Number(p.management_fees || (gross * 0.15));
    return acc + (gross - fees);
  }, 0);

  const weightedAverageRoi = totalInvested > 0 && totalNetRent > 0
    ? ((totalNetRent / totalInvested) * 100).toFixed(2)
    : '0.00';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Private Wealth Portfolio</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">Sintesi Patrimonio & Asset</h1>
          </div>
          <Link href="/admin/partners" className="text-xs font-semibold bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition shadow-sm">
            ⚙️ Pannello Admin Network
          </Link>
        </div>

        {/* 5. BANNER CUMULATIVO DEL PATRIMONIO MULTI-ASSET */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-2">
            <div>
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Myco Executive Summary
              </span>
              <h2 className="text-xl font-bold mt-1 text-white">Consolidato Portafoglio Immobiliare</h2>
            </div>
            <div className="text-xs text-slate-400 font-mono">Immobili Attivi: <strong className="text-white">{properties.length}</strong></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-medium">Capitale Totale Deployato</span>
              <p className="text-2xl sm:text-3xl font-black text-white">{formatCurrency(totalInvested)}</p>
              <span className="text-[10px] text-slate-400 block">Valore cumulativo d'acquisto</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-emerald-400 uppercase font-medium">Netto Bonificato Annuale</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">{formatCurrency(totalNetRent)}</p>
              <span className="text-[10px] text-slate-400 block">Rendita netta su tutti gli asset</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-amber-400 uppercase font-medium">ROI Medio Ponderato</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-400">{weightedAverageRoi}%</p>
              <span className="text-[10px] text-slate-400 block">Rendimento globale portafoglio</span>
            </div>
          </div>
        </div>

        {/* ELENCO IMMOBILI */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">I Tuoi Asset Immobiliari</h3>

          {loading ? (
            <p className="text-xs text-slate-400 italic">Caricamento patrimonio...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((p) => (
                <Link key={p.id} href={`/dashboard/properties/${p.id}`} className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 block">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{p.city}</span>
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition">{p.title}</h4>
                      <p className="text-xs text-slate-500">{p.address}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-900 font-bold text-xs px-3 py-1 rounded-lg">
                      {p.current_phase || 'ACQUISTO'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Valore Asset</span>
                      <p className="font-bold text-slate-900">{formatCurrency(p.price || 0)}</p>
                    </div>
                    <div>
                      <span className="text-emerald-600 block text-[10px] uppercase">Rendita Mensile</span>
                      <p className="font-bold text-emerald-600">{formatCurrency(p.monthly_rent || 0)}/m</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}