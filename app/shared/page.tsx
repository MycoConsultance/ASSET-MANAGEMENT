'use client';

import { useState, useEffect } from 'react';
import VendorNavbar from '@/components/VendorNavbar';
import { createClient } from '@/lib/supabase/client';

export default function VendorSharedPage() {
  const supabase = createClient();
  
  const [partnerCategory, setPartnerCategory] = useState<'IMPRESA_EDILE' | 'NOTAIO' | 'PROPERTY_MANAGER' | 'FOTOGRAFO'>('IMPRESA_EDILE');
  const [profileCompleted, setProfileCompleted] = useState<boolean>(false);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  
  // Form State Setup Profilo
  const [studioName, setStudioName] = useState('');
  const [studioBio, setStudioBio] = useState('');
  
  // Form State Rendiconto PM
  const [grossIncome, setGrossIncome] = useState('');
  const [operatingExpenses, setOperatingExpenses] = useState('');
  const [reportSaved, setReportSaved] = useState(false);

  // Form State SAL Impresa
  const [salProgress, setSalProgress] = useState(65);

  useEffect(() => {
    async function loadVendorInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Legge la categoria dal metadata o fallback
        const cat = user.user_metadata?.partner_category || 'IMPRESA_EDILE';
        setPartnerCategory(cat);
        setProfileCompleted(user.user_metadata?.profile_completed || false);
      }
    }
    loadVendorInfo();
  }, [supabase]);

  const handleSaveProfile = () => {
    setProfileCompleted(true);
    setShowProfileSetup(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <VendorNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
        
        {/* BANNER PRIMO ACCESSO: MICRO-ONBOARDING PROFILO */}
        {!profileCompleted && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-6 rounded-3xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="bg-slate-950 text-amber-400 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Action Required
              </span>
              <h3 className="text-base font-black">Completa la scheda del tuo Studio</h3>
              <p className="text-xs font-medium text-slate-900/80">
                Inserisci logo, bio e 3 foto portfolio per comparire nella lista dei Fornitori Consigliati Myco.
              </p>
            </div>
            <button
              onClick={() => setShowProfileSetup(!showProfileSetup)}
              className="bg-slate-950 text-amber-400 hover:bg-slate-900 text-xs font-extrabold px-4 py-2.5 rounded-xl transition shrink-0 cursor-pointer"
            >
              {showProfileSetup ? 'Chiudi Form' : '⚡ Completa Ora (2 min)'}
            </button>
          </div>
        )}

        {/* MODALE / DROPDOWN SETUP PROFILO */}
        {showProfileSetup && (
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Setup Scheda Partner Consigliato</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nome Studio / Ragione Sociale</label>
                <input
                  type="text"
                  placeholder="Es. Edilizia Moderna Srl"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Specializzazione & Bio</label>
                <input
                  type="text"
                  placeholder="Es. Specializzati in ristrutturazioni HNWI e restyling energetici"
                  value={studioBio}
                  onChange={(e) => setStudioBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              className="bg-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl hover:bg-amber-400 transition"
            >
              Invia per Approvazione Staff Myco
            </button>
          </div>
        )}

        {/* HEADER WORKSPACE DINAMICO */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Workspace Operativo
            </h1>
            <p className="text-xs text-slate-500">
              Profilo Attivo: <span className="font-bold text-slate-700 uppercase">{partnerCategory.replace('_', ' ')}</span>
            </p>
          </div>
          
          {/* TEST TOGGLE SWITCHER CATEGORIA */}
          <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-xl text-[10px] font-bold text-slate-600">
            <button
              onClick={() => setPartnerCategory('IMPRESA_EDILE')}
              className={`px-2 py-1 rounded-lg ${partnerCategory === 'IMPRESA_EDILE' ? 'bg-slate-900 text-white' : ''}`}
            >
              Impresa
            </button>
            <button
              onClick={() => setPartnerCategory('NOTAIO')}
              className={`px-2 py-1 rounded-lg ${partnerCategory === 'NOTAIO' ? 'bg-slate-900 text-white' : ''}`}
            >
              Notaio
            </button>
            <button
              onClick={() => setPartnerCategory('PROPERTY_MANAGER')}
              className={`px-2 py-1 rounded-lg ${partnerCategory === 'PROPERTY_MANAGER' ? 'bg-slate-900 text-white' : ''}`}
            >
              Property Manager
            </button>
            <button
              onClick={() => setPartnerCategory('FOTOGRAFO')}
              className={`px-2 py-1 rounded-lg ${partnerCategory === 'FOTOGRAFO' ? 'bg-slate-900 text-white' : ''}`}
            >
              Fotografo
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* A. VISTA IMPRESA EDILE / GENERAL CONTRACTOR               */}
        {/* ========================================================= */}
        {partnerCategory === 'IMPRESA_EDILE' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-600 uppercase">Cantiere Assegnato</span>
                  <h3 className="text-lg font-black text-slate-900">Bilocale Garibaldi - Via San Carpoforo 8, Milano</h3>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full">
                  Lavori in Corso
                </span>
              </div>

              {/* MODULO SAL */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-700 uppercase">Avanzamento Lavori (SAL)</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{salProgress}% Completato</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={salProgress}
                  onChange={(e) => setSalProgress(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* BOTTONI AZIONE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                  ➕ Richiedi Variazione Capitolato (Extra-Budget)
                </button>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 border border-slate-200">
                  📄 Carica Computo Metrico / Fattura SAL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* B. VISTA NOTAIO / STUDIO LEGALE                           */}
        {/* ========================================================= */}
        {partnerCategory === 'NOTAIO' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 uppercase">Pratica Notarile In Corso</span>
                <h3 className="text-lg font-black text-slate-900">Acquisto Immobile Via Venti Settembre, Torino</h3>
              </div>
              <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1 rounded-full">
                Rogito Previsto: 28 Ottobre 2026
              </span>
            </div>

            {/* CHECKLIST DUE DILIGENCE */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-slate-700 uppercase block">Checklist Documentazione & Ispezioni</span>
              <div className="space-y-2">
                <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4 rounded" />
                  Ispezione Ipotecaria e Ventennale Conclusa
                </label>
                <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4 rounded" />
                  Conformità Catastale e Urbanistica Verificata
                </label>
                <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                  <input type="checkbox" className="accent-amber-500 w-4 h-4 rounded" />
                  Bozza Atto di Compravendita Inviata a Myco
                </label>
              </div>
            </div>

            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              📤 Carica Bozza Rogito PDF
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* C. VISTA PROPERTY MANAGER                                  */}
        {/* ========================================================= */}
        {partnerCategory === 'PROPERTY_MANAGER' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 uppercase">Gestione Locazione</span>
                <h3 className="text-lg font-black text-slate-900">Trilocale Navigli - Renta Rendita Attiva</h3>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full">
                Inquilino Regolare
              </span>
            </div>

            {/* FORM RENDICONTO MENSILE */}
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-slate-700 uppercase block">Inserimento Rendiconto Mensile Incassi</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Incasso Lordo Percepito (€)</label>
                  <input
                    type="number"
                    placeholder="Es. 1850"
                    value={grossIncome}
                    onChange={(e) => setGrossIncome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Spese Operative Sostenute (€)</label>
                  <input
                    type="number"
                    placeholder="Es. 120"
                    value={operatingExpenses}
                    onChange={(e) => setOperatingExpenses(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <button
                onClick={() => setReportSaved(true)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black py-3 rounded-xl transition shadow-xs"
              >
                💾 Registra Rendiconto Mensile
              </button>

              {reportSaved && (
                <p className="text-xs font-bold text-emerald-600 text-center">
                  ✓ Rendiconto registrato! Il ROI dell'investitore è stato aggiornato automaticamente.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* D. VISTA FOTOGRAFO / HOME STAGER                           */}
        {/* ========================================================= */}
        {partnerCategory === 'FOTOGRAFO' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 uppercase">Incarico Shooting Fotografico</span>
                <h3 className="text-lg font-black text-slate-900">Attico Porta Nuova - Restyling Completato</h3>
              </div>
              <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1 rounded-full">
                Caricamento Immagini
              </span>
            </div>

            {/* MEDIA UPLOADER */}
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3 bg-slate-50 hover:bg-slate-100/50 transition cursor-pointer">
              <div className="text-3xl">📷</div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">Drag & Drop Shooting Fotografico Alta Risoluzione</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Formati accettati: JPG, PNG, RAW (Max 50MB per foto)</p>
              </div>
              <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">
                Seleziona Cartella Immagini
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}