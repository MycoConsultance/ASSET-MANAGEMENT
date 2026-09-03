'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatCurrency, LIFECYCLE_STAGES } from '@/lib/formatters';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PERFORMANCE_DATA = [
  { month: 'Set', capitale: 150000, rendimento: 1200 },
  { month: 'Ott', capitale: 150000, rendimento: 2400 },
  { month: 'Nov', capitale: 150000, rendimento: 3600 },
  { month: 'Dic', capitale: 180000, rendimento: 5100 },
  { month: 'Gen', capitale: 180000, rendimento: 6600 },
  { month: 'Feb', capitale: 210000, rendimento: 8400 },
  { month: 'Mar', capitale: 210000, rendimento: 10200 },
  { month: 'Apr', capitale: 210000, rendimento: 12000 },
  { month: 'Mag', capitale: 260000, rendimento: 14200 },
  { month: 'Giu', capitale: 260000, rendimento: 16400 },
  { month: 'Lug', capitale: 260000, rendimento: 18600 },
  { month: 'Ago', capitale: 260000, rendimento: 20800 },
];

export default function PropertiesDashboardPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1A' | '3A' | 'ALL'>('1A');

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
    // STRATO 1: SFONDO CANVAS SLATE-100 CONFORME
    <main className="min-h-screen bg-slate-100 text-slate-900 py-10 px-4 sm:px-8 font-sans antialiased tracking-tight">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER TOP BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest block">
              Private Wealth Asset Control
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Sintesi Patrimonio & Asset
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="text-xs font-bold bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-slate-800 hover:bg-slate-50 transition shadow-xs"
            >
              ⚙️ Impostazioni
            </Link>
            <Link
              href="/admin/partners"
              className="text-xs font-bold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-xs"
            >
              Pannello Staff
            </Link>
          </div>
        </div>

        {/* STRATO 2: BANNER CARD WHITE INCASTONATO */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md space-y-8">
          
          {/* TOP KPI GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Capitale Totale Deployato
              </span>
              <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                {formatCurrency(totalInvested)}
              </p>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                Valore cumulativo d'acquisto
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Netto Bonificato Annuale
              </span>
              <p className="text-3xl font-black text-emerald-700 tracking-tight mt-1">
                {formatCurrency(totalNetRent)}
              </p>
              <span className="text-[11px] text-emerald-800 font-semibold mt-1 block">
                Accreditato su tutti gli asset
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                ROI Medio Ponderato
              </span>
              <p className="text-3xl font-black text-emerald-700 tracking-tight mt-1">
                {weightedAverageRoi}%
              </p>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                Resa globale del portafoglio
              </span>
            </div>
          </div>

          {/* STYLING GRAFICO RECHARTS NITIDO */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Curva di Rendimento Patrimonio</h3>
                <p className="text-xs text-slate-600 font-medium">Andamento del capitale investito vs rendita cumulata</p>
              </div>

              {/* TIMELINE TOGGLE */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs font-bold">
                <button
                  onClick={() => setTimeframe('1A')}
                  className={`px-3 py-1 rounded-lg transition ${timeframe === '1A' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  1A
                </button>
                <button
                  onClick={() => setTimeframe('3A')}
                  className={`px-3 py-1 rounded-lg transition ${timeframe === '3A' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  3A
                </button>
                <button
                  onClick={() => setTimeframe('ALL')}
                  className={`px-3 py-1 rounded-lg transition ${timeframe === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Tutto
                </button>
              </div>
            </div>

            {/* AREA CHART CON GRIGLIA & VERDE SMERALDO PROFONDO */}
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGradientDeep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [formatCurrency(value), 'Rendimento']}
                  />
                  <Area type="monotone" dataKey="rendimento" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#emeraldGradientDeep)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* LISTA ASSET PHOTO-FIRST */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-300 pb-2">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Asset in Portafoglio ({properties.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
              Caricamento patrimonio in corso...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition duration-200 space-y-4 block"
                  >
                    {/* FOTO IMMOBILE 16:9 CON BADGE SCURO */}
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
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

                      {/* BADGE DI FASE PIENO AD ALTO STACCO */}
                      <span className="absolute top-3 right-3 bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded-full shadow-md border border-slate-800">
                        {stageObj.label}
                      </span>
                    </div>

                    {/* METRICHE ASSET */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                          {p.city}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition tracking-tight mt-0.5">
                          {p.title}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">
                          {p.address}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-600 block text-[10px] uppercase font-bold">Valore Asset</span>
                          <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(p.price || 0)}</p>
                        </div>

                        <div>
                          <span className="text-slate-600 block text-[10px] uppercase font-bold">Canone Incassato</span>
                          <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(grossAnnual)}/a</p>
                        </div>

                        <div>
                          <span className="text-emerald-700 block text-[10px] uppercase font-bold">Netto Bonificato</span>
                          <p className="font-bold text-emerald-700 mt-0.5">{formatCurrency(netAnnual)}/a</p>
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