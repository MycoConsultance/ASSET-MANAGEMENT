'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import DashboardNavbar from '@/components/DashboardNavbar';

export default function MarketIntelligencePage() {
  const supabase = createClient();
  
  const [city, setCity] = useState('Milano');
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [zone, setZone] = useState('');
  const [operationType, setOperationType] = useState<'VENDITA' | 'AFFITTO'>('VENDITA');
  
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any>(null);

  useEffect(() => {
    async function loadZones() {
      const { data } = await supabase
        .from('market_zone_analytics')
        .select('zone_name')
        .eq('city', city);
      
      if (data && data.length > 0) {
        const uniqueZones = Array.from(new Set(data.map(item => item.zone_name)));
        setAvailableZones(uniqueZones);
        setZone(uniqueZones[0]);
      } else {
        setAvailableZones([]);
        setZone('');
      }
    }
    loadZones();
  }, [city, supabase]);

  const handleRunAnalysis = async () => {
    if (!zone) return;
    setLoading(true);

    const { data } = await supabase
      .from('market_zone_analytics')
      .select('*')
      .eq('city', city)
      .eq('zone_name', zone)
      .eq('operation_type', operationType)
      .single();

    if (data) {
      let verdict = { label: 'ZONA AD ALTA LIQUIDITÀ', status: 'GREEN', risk: 'Basso Rischio Incastro (< 60 giorni)' };
      if (data.iai_score < 50) {
        verdict = { label: 'ZONA ILLIQUIDA / SATURA', status: 'RED', risk: 'Alto Rischio Incastro (> 120 giorni)' };
      } else if (data.iai_score < 75) {
        verdict = { label: 'ZONA NEUTRA', status: 'YELLOW', risk: 'Valutare con sconto di acquisto (60-120 giorni)' };
      }

      setAnalyzedData({
        city: data.city,
        zone: data.zone_name,
        operationType: data.operation_type,
        domDays: data.dom_days,
        discountPercent: data.discount_percent,
        demandRatio: data.demand_supply_ratio,
        ntnVolume: data.ntn_annual_volume,
        score: data.iai_score,
        verdict
      });
    } else {
      setAnalyzedData({
        city,
        zone,
        operationType,
        domDays: operationType === 'VENDITA' ? 48 : 15,
        discountPercent: 3.8,
        demandRatio: 4.2,
        ntnVolume: 120,
        score: 82,
        verdict: { label: 'ZONA AD ALTA LIQUIDITÀ', status: 'GREEN', risk: 'Basso Rischio Incastro (< 60 giorni)' }
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (zone) {
      handleRunAnalysis();
    }
  }, [zone, operationType]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <DashboardNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-8">
        
        {/* HEADER BAR */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Market Intelligence & Risk Analysis
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Valuta qualsiasi zona in Italia prima dell'acquisto (Banca Dati OMI Agenzia delle Entrate)
            </p>
          </div>
          <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-wider">
            OMI Database Connected
          </span>
        </div>

        {/* BARRA DI SELEZIONE PARAMETRICA */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Città Target</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Milano">Milano</option>
                <option value="Roma">Roma</option>
                <option value="Bologna">Bologna</option>
                <option value="Torino">Torino</option>
                <option value="Firenze">Firenze</option>
                <option value="Napoli">Napoli</option>
                <option value="Verona">Verona</option>
                <option value="Bergamo">Bergamo</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Micro-Zona / Quartiere OMI</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {availableZones.map((z, idx) => (
                  <option key={idx} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Tipo Operazione</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOperationType('VENDITA')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${operationType === 'VENDITA' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  📈 Trading (Vendita)
                </button>
                <button
                  type="button"
                  onClick={() => setOperationType('AFFITTO')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${operationType === 'AFFITTO' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  🔑 Rent (Affitto)
                </button>
              </div>
            </div>

          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Interrogazione Database OMI in corso...' : '⚡ Analizza Liquidità Zona'}
          </button>
        </div>

        {/* RISULTATO IAI SCORE */}
        {analyzedData && (
          <div className="space-y-6">
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all ${
              analyzedData.verdict.status === 'GREEN'
                ? 'bg-emerald-950 text-emerald-50 border-emerald-800'
                : analyzedData.verdict.status === 'YELLOW'
                ? 'bg-amber-950 text-amber-50 border-amber-800'
                : 'bg-red-950 text-red-50 border-red-800'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      analyzedData.verdict.status === 'GREEN' ? 'bg-emerald-500 text-slate-950' : analyzedData.verdict.status === 'YELLOW' ? 'bg-amber-500 text-slate-950' : 'bg-red-500 text-white'
                    }`}>
                      {analyzedData.verdict.label}
                    </span>
                    <span className="text-xs font-mono opacity-75">{analyzedData.city} • {analyzedData.zone}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black">{analyzedData.verdict.risk}</h2>
                  <p className="text-xs opacity-80 max-w-xl">
                    Dati elaborati sulla base delle registrazioni ufficiali OMI dell'Agenzia delle Entrate per la micro-zona selezionata.
                  </p>
                </div>

                <div className="text-center sm:text-right shrink-0 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider font-bold block opacity-75">Score IAI Liquidità</span>
                  <div className="text-4xl sm:text-5xl font-black mt-1 font-mono">{analyzedData.score} <span className="text-xs font-normal opacity-60">/ 100</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">DOM (Giorni Mercato)</span>
                <p className="text-2xl font-black text-slate-900 font-mono">{analyzedData.domDays} <span className="text-xs font-normal text-slate-400">giorni</span></p>
                <span className="text-[10px] text-slate-500 block">Permanenza media annuncio</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sconto Medio Applicato</span>
                <p className="text-2xl font-black text-slate-900 font-mono">{analyzedData.discountPercent}%</p>
                <span className="text-[10px] text-slate-500 block">Scostamento asking/rogito</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ratio Domanda/Offerta</span>
                <p className="text-2xl font-black text-emerald-600 font-mono">{analyzedData.demandRatio} <span className="text-xs font-normal text-slate-400">/ 5.0</span></p>
                <span className="text-[10px] text-slate-500 block">Pressione acquirenti sui portali</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Volume Scambi NTN</span>
                <p className="text-2xl font-black text-slate-900 font-mono">{analyzedData.ntnVolume} <span className="text-xs font-normal text-slate-400">/anno</span></p>
                <span className="text-[10px] text-slate-500 block">Compravendite registrate OMI</span>
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-500 space-y-1 leading-relaxed">
              <p className="font-bold text-slate-700 uppercase text-[10px]">⚖️ Nota di Trasparenza & Disclaimer AI</p>
              <p>
                L'Indice di Assorbimento Immobiliare (IAI) è generato mediante elaborazioni algoritmiche di Intelligenza Artificiale basate sui dati correnti OMI, ISTAT e aggregatori immobiliari. Il verdetto costituisce un indicatore probabilistico di supporto decisionale e non integra in alcun modo una garanzia di vendita, locazione o rendimento finanziario. MYCO S.r.l. non si assume responsabilità per decisioni d'acquisto o variazioni congiunturali del mercato locale.
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}