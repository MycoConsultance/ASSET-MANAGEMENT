'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardNavbar from '@/components/DashboardNavbar';

const FALLBACK_CITIES = ['Milano', 'Roma', 'Bologna', 'Torino', 'Firenze', 'Napoli', 'Verona', 'Bergamo'];

export default function MarketIntelligencePage() {
  const supabase = createClient();
  
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>(FALLBACK_CITIES);
  const [city, setCity] = useState('Milano');
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [zone, setZone] = useState('');
  const [operationType, setOperationType] = useState<'VENDITA' | 'AFFITTO'>('VENDITA');
  
  const [loading, setLoading] = useState(true);
  const [analyzedData, setAnalyzedData] = useState<any>(null);

  // 1. Carica dati da Supabase
  useEffect(() => {
    async function fetchOmiData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('market_zone_analytics')
          .select('*');

        if (data && data.length > 0) {
          setAllRecords(data);
          const cities = Array.from(new Set(data.map((item: any) => item.city))).sort();
          if (cities.length > 0) {
            setAvailableCities(cities);
            if (!cities.includes(city)) setCity(cities[0]);
          }
        }
      } catch (err) {
        console.error('Errore DB:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOmiData();
  }, [supabase]);

  // 2. Filtra Micro-Zone per la Città selezionata
  useEffect(() => {
    if (!city) return;

    if (allRecords.length > 0) {
      const cityZones = allRecords
        .filter(item => item.city.toLowerCase() === city.toLowerCase())
        .map(item => item.zone_name);

      const uniqueZones = Array.from(new Set(cityZones)).sort();
      setAvailableZones(uniqueZones);
      if (uniqueZones.length > 0) setZone(uniqueZones[0]);
    }
  }, [city, allRecords]);

  // 3. Analisi ibrida: Immobiliare.it API (se Milano Duomo) o Supabase OMI (altre zone)
  const handleRunAnalysis = async () => {
    if (!zone || !city) return;
    setLoading(true);

    // Controlla se la zona corrente ha la copertura Sandbox Immobiliare.it
    const isDuomoSandbox = 
      city.toLowerCase() === 'milano' && 
      (zone.toLowerCase().includes('duomo') || zone.toLowerCase().includes('vittorio emanuele'));

    if (isDuomoSandbox) {
      try {
        const res = await fetch(`/api/immobiliare?city=${encodeURIComponent(city)}&zone=${encodeURIComponent(zone)}`);
        const immData = await res.json();

        if (immData.isSandbox) {
          setAnalyzedData({
            city: city,
            zone: zone,
            operationType: operationType,
            domDays: immData.metrics.dom_days_avg,
            discountPercent: immData.metrics.discount_percent_avg,
            demandRatio: immData.metrics.demand_supply_ratio,
            ntnVolume: immData.metrics.active_listings_count,
            score: immData.metrics.iai_score,
            valMin: immData.metrics.asking_price_m2_min,
            valMax: immData.metrics.asking_price_m2_max,
            dataPeriod: 'Settembre 2026 (Live API)',
            isLiveApi: true,
            apiSource: 'Immobiliare.it Insights Sandbox',
            verdict: {
              label: 'ZONA PREMIUM HIGH-LIQUIDITY',
              status: 'GREEN',
              risk: 'Basso Rischio Incastro (Market Demand Max)'
            }
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Errore fetch API Immobiliare.it, fallback a OMI', e);
      }
    }

    // Fallback standard su database OMI Supabase
    const matched = allRecords.find(
      item =>
        item.city.toLowerCase() === city.toLowerCase() &&
        item.zone_name === zone &&
        item.operation_type === operationType
    ) || allRecords.find(
      item => item.city.toLowerCase() === city.toLowerCase() && item.zone_name === zone
    );

    if (matched) {
      let verdict = { label: 'ZONA AD ALTA LIQUIDITÀ', status: 'GREEN', risk: 'Basso Rischio Incastro (< 60 giorni)' };
      if (matched.iai_score < 50) {
        verdict = { label: 'ZONA ILLIQUIDA / SATURA', status: 'RED', risk: 'Alto Rischio Incastro (> 120 giorni)' };
      } else if (matched.iai_score < 75) {
        verdict = { label: 'ZONA NEUTRA', status: 'YELLOW', risk: 'Valutare con sconto di acquisto (60-120 giorni)' };
      }

      setAnalyzedData({
        city: matched.city,
        zone: matched.zone_name,
        operationType: matched.operation_type,
        domDays: matched.dom_days,
        discountPercent: matched.discount_percent,
        demandRatio: matched.demand_supply_ratio,
        ntnVolume: matched.ntn_annual_volume,
        score: matched.iai_score,
        valMin: matched.val_m2_min,
        valMax: matched.val_m2_max,
        dataPeriod: matched.data_period || '2° Semestre 2025',
        isLiveApi: false,
        apiSource: 'Agenzia delle Entrate (OMI)',
        verdict
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (zone) {
      handleRunAnalysis();
    }
  }, [zone, operationType, allRecords]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <DashboardNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-8">
        
        {/* HEADER TOP BAR */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Market Intelligence & Risk Analysis
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrazione Hybrid: OMI Agenzia delle Entrate & API Immobiliare.it Insights
            </p>
          </div>
          
          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
            analyzedData?.isLiveApi 
              ? 'bg-blue-600 text-white animate-pulse' 
              : 'bg-amber-500 text-slate-950'
          }`}>
            {analyzedData?.isLiveApi ? '📡 API Live Immobiliare.it Sandbox' : `OMI Data: ${analyzedData?.dataPeriod || '2° Semestre 2025'}`}
          </span>
        </div>

        {/* BARRA SELEZIONE PARAMETRICA */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Città Target</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {availableCities.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Micro-Zona / Quartiere OMI</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                disabled={availableZones.length === 0}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
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
            disabled={loading || !zone}
            className="w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Caricamento dati in corso...' : '⚡ Analizza Liquidità Zona'}
          </button>
        </div>

        {/* RISULTATO ANALYSIS */}
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
                    Fonte Dati: <strong className="text-amber-300">{analyzedData.apiSource}</strong> ({analyzedData.dataPeriod}).
                    {analyzedData.valMin && (
                      <span className="block mt-1 font-bold text-amber-300">
                        Quotazione al m² ({analyzedData.isLiveApi ? 'Asking Price Live' : 'Valore OMI Registrato'}): {analyzedData.valMin.toLocaleString('it-IT')} € - {analyzedData.valMax.toLocaleString('it-IT')} €/m²
                      </span>
                    )}
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
                <span className="text-[10px] font-bold text-slate-400 uppercase">{analyzedData.isLiveApi ? 'Annunci Attivi' : 'Volume Scambi NTN'}</span>
                <p className="text-2xl font-black text-slate-900 font-mono">{analyzedData.ntnVolume} <span className="text-xs font-normal text-slate-400">{analyzedData.isLiveApi ? 'attivi' : '/anno'}</span></p>
                <span className="text-[10px] text-slate-500 block">{analyzedData.isLiveApi ? 'Campione portale Immobiliare.it' : 'Compravendite registrate OMI'}</span>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}