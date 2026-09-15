'use client';

import { useState, useEffect } from 'react';
import VendorNavbar from '@/components/VendorNavbar';
import { createClient } from '@/lib/supabase/client';

// 13 Ruoli dell'Ecosistema MYCO
type PartnerCategory = 
  | 'SCOUT_BROKER' | 'PERITO_ASTE' | 'GEOMETRA'
  | 'NOTAIO' | 'BROKER_MUTUI'
  | 'GENERAL_CONTRACTOR' | 'ARCHITETTO' | 'HOME_STAGER_FOTOGRAFO'
  | 'PROPERTY_MANAGER' | 'COMMERCIALISTA' | 'BROKER_ASSICURATIVO' | 'AVVOCATO' | 'AGENTE_RIVENDITA';

export default function SharedAssetDetailPage() {
  const supabase = createClient();
  
  const [partnerCategory, setPartnerCategory] = useState<PartnerCategory>('GENERAL_CONTRACTOR');
  const [currentPhase, setCurrentPhase] = useState<number>(3); // Fase 3: Restyling
  const [partnerCompetencePhase, setPartnerCompetencePhase] = useState<number>(3);
  
  // State Form Dinamici
  const [salProgress, setSalProgress] = useState(65);
  const [grossIncome, setGrossIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [newComment, setNewComment] = useState('');
  const [actionSaved, setActionSaved] = useState(false);

  useEffect(() => {
    async function loadVendorInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cat = (user.user_metadata?.partner_category || 'GENERAL_CONTRACTOR') as PartnerCategory;
        setPartnerCategory(cat);

        // Mappa la fase di competenza del ruolo
        if (['SCOUT_BROKER', 'PERITO_ASTE', 'GEOMETRA'].includes(cat)) setPartnerCompetencePhase(1);
        else if (['NOTAIO', 'BROKER_MUTUI'].includes(cat)) setPartnerCompetencePhase(2);
        else if (['GENERAL_CONTRACTOR', 'ARCHITETTO', 'HOME_STAGER_FOTOGRAFO'].includes(cat)) setPartnerCompetencePhase(3);
        else setPartnerCompetencePhase(4);
      }
    }
    loadVendorInfo();
  }, [supabase]);

  const isReadOnlyPhase = currentPhase > partnerCompetencePhase;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <VendorNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* 1. HEADER CONTESTO ASSET & PROFILO PARTNER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-amber-400 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Partner Workspace
                </span>
                <span className="text-xs text-slate-500 font-bold">• Category: <strong className="text-slate-900 uppercase">{partnerCategory.replace(/_/g, ' ')}</strong></span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Bilocale Garibaldi
              </h1>
              <p className="text-xs font-mono text-slate-500">
                📍 Via San Carpoforo 8, Milano (MI)
              </p>
            </div>

            {/* BADGE FASE & STATUS READ-ONLY */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shrink-0">
              <div className="space-y-0.5">
                <span className={`font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase ${
                  isReadOnlyPhase ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Fase {currentPhase}: Cantiere & Restyling
                </span>
                <p className="text-xs font-bold text-slate-700">
                  Stato Operativo: <span className="font-mono text-slate-900">{isReadOnlyPhase ? '🔒 Sola Lettura (Fase Conclusa)' : '⚡ Azioni Abilitate'}</span>
                </p>
              </div>

              <div className="text-right border-l border-slate-200 pl-4 font-mono">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Completion</span>
                <span className="text-sm font-black text-slate-900">28 Nov 2026</span>
              </div>
            </div>

          </div>
        </div>

        {/* LAYOUT PRINCIPALE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLONNA PRINCIPALE (2/3): ACTION MODULE DEDICATO ALLA CATEGORIA */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    ⚡ Action Module: {partnerCategory.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-slate-500">Modulo operativo di competenza professionale</p>
                </div>
                {isReadOnlyPhase && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                    🔒 Archivio Storico (Sola Lettura)
                  </span>
                )}
              </div>

              {/* A. GENERAL CONTRACTOR / IMPRESA */}
              {partnerCategory === 'GENERAL_CONTRACTOR' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Avanzamento Lavori Cantiere (SAL)</span>
                      <span className="font-mono text-amber-600">{salProgress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      disabled={isReadOnlyPhase}
                      value={salProgress}
                      onChange={(e) => setSalProgress(Number(e.target.value))}
                      className="w-full accent-amber-500 h-2 bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button disabled={isReadOnlyPhase} className="bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-40">
                      ➕ Richiedi Variazione Capitolato
                    </button>
                    <button disabled={isReadOnlyPhase} className="bg-slate-100 text-slate-900 text-xs font-bold py-3 rounded-xl border border-slate-200 hover:bg-slate-200 transition disabled:opacity-40">
                      📄 Carica Computo / Fattura SAL
                    </button>
                  </div>
                </div>
              )}

              {/* B. PROPERTY MANAGER */}
              {partnerCategory === 'PROPERTY_MANAGER' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Incasso Lordo Percepito (€)</label>
                      <input
                        type="number"
                        disabled={isReadOnlyPhase}
                        placeholder="Es. 1850"
                        value={grossIncome}
                        onChange={(e) => setGrossIncome(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Spese Operative Sostenute (€)</label>
                      <input
                        type="number"
                        disabled={isReadOnlyPhase}
                        placeholder="Es. 120"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <button
                    disabled={isReadOnlyPhase}
                    onClick={() => setActionSaved(true)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl transition disabled:opacity-40"
                  >
                    💾 Registra Consuntivo Mensile
                  </button>
                  {actionSaved && <p className="text-xs text-emerald-600 font-bold text-center">✓ Consuntivo inviato allo Staff Myco!</p>}
                </div>
              )}

              {/* C. NOTAIO / STUDIO LEGALE / GEOMETRA */}
              {(partnerCategory === 'NOTAIO' || partnerCategory === 'GEOMETRA' || partnerCategory === 'AVVOCATO') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-slate-700 uppercase block">Checklist Adempimenti e Pratiche</span>
                    <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold">
                      <input type="checkbox" defaultChecked disabled={isReadOnlyPhase} className="accent-amber-500 w-4 h-4 rounded" />
                      Ispezioni Ipotecarie / Conformità Catastale Verificata
                    </label>
                  </div>
                  <button disabled={isReadOnlyPhase} className="w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-40">
                    📤 Upload Atto / Pratica Asseverata (PDF)
                  </button>
                </div>
              )}

              {/* D. HOME STAGER / FOTOGRAFO */}
              {partnerCategory === 'HOME_STAGER_FOTOGRAFO' && (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 bg-slate-50">
                  <div className="text-2xl">📸</div>
                  <p className="text-xs font-bold text-slate-800">Media Asset Uploader (Shooting HD)</p>
                  <button disabled={isReadOnlyPhase} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40">
                    Seleziona Immagini Alta Risoluzione
                  </button>
                </div>
              )}

              {/* E. FALLBACK GENERICO PER ALTRI RUOLI */}
              {!['GENERAL_CONTRACTOR', 'PROPERTY_MANAGER', 'NOTAIO', 'GEOMETRA', 'AVVOCATO', 'HOME_STAGER_FOTOGRAFO'].includes(partnerCategory) && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <span className="font-bold text-slate-900 block">Modulo Operativo Attivo</span>
                  <p>Invia report di aggiornamento o documentazione relativa alla tua area di competenza professionale.</p>
                  <button disabled={isReadOnlyPhase} className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl disabled:opacity-40">
                    📤 Upload Documentazione
                  </button>
                </div>
              )}

            </div>

            {/* FASCICOLO SELETTIVO + MICRO-FEED NOTE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                📁 Fascicolo Digitale & Micro-Feed Notazioni Tecniche
              </h3>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📄</span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Tavola Progetto Esecutivo A2.pdf</h4>
                      <span className="text-[10px] text-slate-400">Caricato da Arch. Stefano Bianchi • 12 Set 2026</span>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">Cantiere</span>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Log Notazioni Tecniche</span>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 text-[10px] block">EdilCostruzioni Srl</span>
                    <p className="text-slate-600 text-[11px]">Richiesto chiarimento su posizione colonna di scarico bagni (Tavola A2).</p>
                  </div>
                  {!isReadOnlyPhase && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Scrivi notazione tecnica su questo file..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                      <button className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                        Invia
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* COLONNA SIDEBAR (1/3): WIDGET TEAM DI PROGETTO & REGIA MYCO */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  👥 Team di Progetto Asset
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Interlocutori abilitati allo scambio atti & note
                </p>
              </div>

              <div className="space-y-3">
                
                {/* STAFF MYCO CONCIERGE (ALWAYS PRESENT) */}
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="bg-amber-500 text-slate-950 font-black text-[10px] w-8 h-8 rounded-xl flex items-center justify-center">
                    MYCO
                  </div>
                  <div>
                    <span className="text-xs font-extrabold block">Staff Myco Concierge</span>
                    <span className="text-[10px] text-amber-400 font-bold">⚙️ Regia Operativa & Oversight</span>
                  </div>
                </div>

                {/* ARCHITETTO */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                  <span className="text-base">📐</span>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Arch. Stefano Bianchi</span>
                    <span className="text-[10px] text-slate-500 font-bold">Direttore Lavori / Progettista</span>
                  </div>
                </div>

                {/* GEOMETRA */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                  <span className="text-base">📏</span>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Geom. Marco Verdi</span>
                    <span className="text-[10px] text-slate-500 font-bold">Pratiche Catastali & CILA</span>
                  </div>
                </div>

              </div>

              <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                🔒 Dati dell'investitore e gli altri asset del circuito sono rigorosamente segregati lato server.
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}