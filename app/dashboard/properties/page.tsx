'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatCurrency, LIFECYCLE_STAGES } from '@/lib/formatters';

export default function PropertiesDashboardPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      // Recupera gli immobili e la prima immagine della galleria media per ciascuno
      const { data: props } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      
      if (props) {
        const enrichedProps = await Promise.all(
          props.map(async (p) => {
            const { data: media } = await supabase
              .from('property_media')
              .select('file_url')
              .eq('property_id', p.id)
              .limit(1)
              .maybeSingle();
            return { ...p, cover_image: media?.file_url || null };
          })
        );
        setProperties(enrichedProps);
      }
      setLoading(false);
    }
    fetchProperties();
  }, [supabase]);

  // CALCOLO METRICHE GLOBALI CONSOLIDATE
  const totalInvested = properties.reduce((acc, p) => acc + Number(p.price || 0), 0);
  const totalNetRent = properties.reduce((acc, p) => {
    const gross = Number(p.monthly_rent || 0) * 12;
    const fees = Number(p.management_fees || (gross * 0.15));
    return acc + (gross - fees);
  }, 0);

  const weightedAverageRoi = totalInvested > 0 && totalNetRent > 0
    ? ((totalNetRent / totalInvested) * 100).toFixed(2)
    : '0.00';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-8 font-sans antialiased tracking-tight">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* TOP BAR HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Private Wealth Asset Control
            </span>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
              Sintesi Patrimonio
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="text-xs font-semibold bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              ⚙️ Impostazioni
            </Link>
            <Link
              href="/admin/partners"
              className="text-xs font-semibold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm"
            >
              Pannello Staff
            </Link>
          </div>
        </div>

        {/* 1. RESTRUCTURING BANNER PORTAFOGLIO (QUIET LUXURY 3-CARDS GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
              Capitale Totale Deployato
            </span>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalInvested)}
            </p>
            <span className="text-[11px] text-slate-400 mt-2 block font-normal">
              Valore complessivo d'acquisto patrimonio
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
              Netto Bonificato Annuale
            </span>
            <p className="text-3xl font-bold text-emerald-600 tracking-tight">
              {formatCurrency(totalNetRent)}
            </p>
            <span className="text-[11px] text-slate-400 mt-2 block font-normal">
              Rendita netta accreditata all'investitore
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
              ROI Medio Ponderato
            </span>
            <p className="text-3xl font-bold text-emerald-600 tracking-tight">
              {weightedAverageRoi}%
            </p>
            <span className="text-[11px] text-slate-400 mt-2 block font-normal">
              Rendimento ponderato su tutti gli asset
            </span>
          </div>

        </div>

        {/* 2. LAYOUT CARD IMMOBILE (PHOTO-FIRST & SOFT STYLE) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Asset in Portafoglio ({properties.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium uppercase tracking-widest">
              Caricamento patrimonio in corso...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {properties.map((p) => {
                const currentPhaseId = p.current_phase || 'ACQUISTO_DEAL';
                const stageObj = LIFECYCLE_STAGES.find(s => s.id === currentPhaseId) || LIFECYCLE_STAGES[0];

                const grossAnnual = Number(p.monthly_rent || 0) * 12;
                const feesAnnual = Number(p.management_fees || (grossAnnual * 0.15));
                const netAnnual = grossAnnual - feesAnnual;

                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/properties/${p.id}`}
                    className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col sm:flex-row gap-5 items-stretch"
                  >
                    {/* A SINISTRA: FOTO COPERTINA IMMOBILE */}
                    <div className="w-full sm:w-56 h-40 sm:h-auto min-h-[140px] relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0">
                      {p.cover_image ? (
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
                          <span className="text-2xl mb-1">🏛️</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Architettura Myco
                          </span>
                        </div>
                      )}
                    </div>

                    {/* A DESTRA: DETTAGLI & BADGE SOFT */}
                    <div className="flex-1 flex flex-col justify-between py-1 space-y-3">
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {p.city}
                          </span>
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition tracking-tight">
                            {p.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-normal mt-0.5">
                            {p.address}
                          </p>
                        </div>

                        {/* BADGE DI FASE PILL STILO */}
                        <span className="bg-amber-50 text-amber-900 border border-amber-200/80 text-xs px-3 py-1 rounded-full font-semibold shadow-2xs whitespace-nowrap">
                          {stageObj.label}
                        </span>
                      </div>

                      {/* METRICHE ASSET */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-medium">Valore Asset</span>
                          <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(p.price || 0)}</p>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-medium">Canone Incassato</span>
                          <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(grossAnnual)}/anno</p>
                        </div>

                        <div>
                          <span className="text-emerald-600 block text-[10px] uppercase font-semibold">Netto Bonificato</span>
                          <p className="font-bold text-emerald-600 mt-0.5">{formatCurrency(netAnnual)}/anno</p>
                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}