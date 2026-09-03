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
      const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      if (data) setProperties(data);
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

  // Helper per calcolo giorni
  const getDaysCount = (startDateStr: string, endDateStr: string) => {
    const today = new Date();
    const start = startDateStr ? new Date(startDateStr) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDateStr ? new Date(endDateStr) : new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

    const diffDaysPassed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const diffDaysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24)));

    return { daysPassed: diffDaysPassed, daysRemaining: diffDaysRemaining };
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER TOP BAR */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Private Wealth Portfolio</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">Sintesi Patrimonio & Asset</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings" className="text-xs font-semibold bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition shadow-sm">
              ⚙️ Impostazioni
            </Link>
            <Link href="/admin/partners" className="text-xs font-semibold bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition shadow-sm">
              Pannello Staff
            </Link>
          </div>
        </div>

        {/* BANNER SCURO EXECUTIVE */}
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

        {/* ELENCO IMMOBILI CON MINI-STEPPER & TIMELINE */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">I Tuoi Asset Immobiliari ({properties.length})</h3>

          {loading ? (
            <p className="text-xs text-slate-400 italic">Caricamento patrimonio...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((p) => {
                const currentPhaseId = p.current_phase || 'ACQUISTO_DEAL';
                const currentStageObj = LIFECYCLE_STAGES.find(s => s.id === currentPhaseId) || LIFECYCLE_STAGES[0];
                const { daysPassed, daysRemaining } = getDaysCount(p.phase_start_date, p.phase_estimated_end_date);

                return (
                  <Link key={p.id} href={`/dashboard/properties/${p.id}`} className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5 block">
                    
                    {/* TOP HEADER CARD */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{p.city}</span>
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition">{p.title}</h4>
                        <p className="text-xs text-slate-500">{p.address}</p>
                      </div>

                      {/* BADGE FASE + CONTATORE TEMPORALE */}
                      <div className="text-right space-y-1">
                        <span className="inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded-lg">
                          {currentStageObj.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          Da {daysPassed} gg • Consegna tra {daysRemaining} gg
                        </span>
                      </div>
                    </div>

                    {/* 1. MINI-STEPPER A 5 PALLINI */}
                    <div className="pt-2 pb-1 border-t border-b border-slate-100">
                      <div className="flex items-center justify-between relative px-2">
                        {/* Linea orizzontale di sfondo */}
                        <div className="absolute top-[14px] left-4 right-4 h-0.5 bg-slate-200 -z-0" />
                        
                        {LIFECYCLE_STAGES.map((stage) => {
                          const isCompleted = stage.step < currentStageObj.step;
                          const isCurrent = stage.step === currentStageObj.step;

                          return (
                            <div key={stage.id} className="z-10 flex flex-col items-center group/node relative">
                              {isCompleted && (
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                  ✓
                                </div>
                              )}
                              {isCurrent && (
                                <div className="w-7 h-7 rounded-full bg-slate-900 text-white ring-4 ring-slate-100 flex items-center justify-center text-xs font-bold shadow-sm">
                                  {stage.step}
                                </div>
                              )}
                              {!isCompleted && !isCurrent && (
                                <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center text-[9px] font-medium">
                                  {stage.step}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* METRICHE FINANZIARIE CARD */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
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
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}