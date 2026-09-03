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
    <main className="min-h-screen bg-slate-100/70 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TOP BAR HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">
              Private Wealth Portfolio
            </span>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight mt-0.5">
              Sintesi Patrimonio & Asset
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="text-xs font-semibold bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              ⚙️ Impostazioni
            </Link>
            <Link
              href="/admin/partners"
              className="text-xs font-semibold bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              ⚙️ Pannello Admin Network
            </Link>
          </div>
        </div>

        {/* BANNER EXECUTIVE SCURO RIPRISTINATO */}
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-2">
            <div>
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Myco Executive Summary
              </span>
              <h2 className="text-xl font-bold mt-1 text-white tracking-tight">Consolidato Portafoglio Immobiliare</h2>
            </div>
            <div className="text-xs text-slate-400 font-mono">Immobili Attivi: <strong className="text-white font-bold">{properties.length}</strong></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Capitale Totale Deployato</span>
              <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(totalInvested)}</p>
              <span className="text-[10px] text-slate-500 block">Valore cumulativo d'acquisto</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-emerald-400 uppercase font-semibold tracking-wider">Netto Bonificato Annuale</span>
              <p className="text-3xl font-black text-emerald-400 tracking-tight">{formatCurrency(totalNetRent)}</p>
              <span className="text-[10px] text-slate-500 block">Rendita netta su tutti gli asset</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-amber-400 uppercase font-semibold tracking-wider">ROI Medio Ponderato</span>
              <p className="text-3xl font-black text-amber-400 tracking-tight">{weightedAverageRoi}%</p>
              <span className="text-[10px] text-slate-500 block">Rendimento globale portafoglio</span>
            </div>
          </div>
        </div>

        {/* ELENCO IMMOBILI STRUCTURATO */}
        <div className="space-y-4">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
            I Tuoi Asset Immobiliari ({properties.length})
          </h2>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold uppercase tracking-widest">
              Caricamento patrimonio...
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
                    className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col sm:flex-row gap-6 items-stretch"
                  >
                    {/* FOTO / PLACEHOLDER A SINISTRA */}
                    <div className="w-full sm:w-60 h-44 sm:h-auto min-h-[130px] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
                      {p.cover_image ? (
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center bg-slate-900">
                          <span className="text-3xl mb-1">🏛️</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            MYCO PRIVATE WEALTH
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DETTAGLI ASSET */}
                    <div className="flex-1 flex flex-col justify-between py-1 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest block">
                            {p.city}
                          </span>
                          <h3 className="text-xl font-bold text-slate-950 group-hover:text-amber-600 transition tracking-tight mt-0.5">
                            {p.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {p.address}
                          </p>
                        </div>

                        <span className="bg-slate-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-xs">
                          {stageObj.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Valore Asset</span>
                          <p className="font-extrabold text-slate-900 mt-0.5">{formatCurrency(p.price || 0)}</p>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Canone Incassato</span>
                          <p className="font-extrabold text-slate-900 mt-0.5">{formatCurrency(grossAnnual)}/anno</p>
                        </div>

                        <div>
                          <span className="text-emerald-600 block text-[10px] font-bold uppercase">Netto Bonificato</span>
                          <p className="font-extrabold text-emerald-600 mt-0.5">{formatCurrency(netAnnual)}/anno</p>
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