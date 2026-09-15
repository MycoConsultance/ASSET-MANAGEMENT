'use client';

import { useState, useEffect } from 'react';
import VendorNavbar from '@/components/VendorNavbar';
import { createClient } from '@/lib/supabase/client';

export default function VendorSharedPage() {
  const supabase = createClient();
  
  const [partnerCategory, setPartnerCategory] = useState<'IMPRESA_EDILE' | 'NOTAIO' | 'PROPERTY_MANAGER' | 'FOTOGRAFO'>('IMPRESA_EDILE');
  const [verificationStatus, setVerificationStatus] = useState<'UNSUBMITTED' | 'PENDING_VERIFICATION' | 'APPROVED'>('UNSUBMITTED');
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  
  // Form State Setup Profilo
  const [studioName, setStudioName] = useState('');
  const [studioBio, setStudioBio] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  // State SAL Impresa Edile
  const [salProgress, setSalProgress] = useState(65);

  useEffect(() => {
    async function loadVendorInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Il ruolo è RIGIDO, letto esclusivamente da Supabase
        const cat = user.user_metadata?.partner_category || 'IMPRESA_EDILE';
        setPartnerCategory(cat);
        setVerificationStatus(user.user_metadata?.verification_status || 'UNSUBMITTED');
      }
    }
    loadVendorInfo();
  }, [supabase]);

  const handleSubmitProfile = async () => {
    // Invio della scheda in stato di verifica (Staging)
    setVerificationStatus('PENDING_VERIFICATION');
    setShowProfileSetup(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <VendorNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
        
        {/* BANNER 1: PROFILO DA COMPLETARE */}
        {verificationStatus === 'UNSUBMITTED' && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-6 rounded-3xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="bg-slate-950 text-amber-400 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Accreditamento Professionale
              </span>
              <h3 className="text-base font-black">Invia Documentazione & Scheda Studio</h3>
              <p className="text-xs font-medium text-slate-900/80">
                Carica il tuo DURC/Iscrizione Albo e le foto portfolio per la verifica documentale da parte dello Staff Myco.
              </p>
            </div>
            <button
              onClick={() => setShowProfileSetup(!showProfileSetup)}
              className="bg-slate-950 text-amber-400 hover:bg-slate-900 text-xs font-extrabold px-4 py-2.5 rounded-xl transition shrink-0 cursor-pointer"
            >
              {showProfileSetup ? 'Chiudi Form' : '📁 Completa Accreditamento'}
            </button>
          </div>
        )}

        {/* BANNER 2: STAGING / VERIFICA IN CORSO */}
        {verificationStatus === 'PENDING_VERIFICATION' && (
          <div className="bg-blue-950 text-blue-50 p-6 rounded-3xl border border-blue-800 shadow-md flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-blue-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Verifica in Corso (Staging)
              </span>
              <h3 className="text-base font-black text-white">Scheda Studio inviata allo Staff Myco</h3>
              <p className="text-xs text-blue-200">
                I tuoi contenuti e i documenti di abilitazione (DURC / Albo) sono in fase di revisione qualità. Riceverai la certificazione <strong className="text-amber-400 font-bold">★ Consigliato da Myco</strong> al termine della verifica.
              </p>
            </div>
            <div className="text-xl">⏳</div>
          </div>
        )}

        {/* BANNER 3: PARTNER APPROVATO E CERTIFICATO */}
        {verificationStatus === 'APPROVED' && (
          <div className="bg-emerald-950 text-emerald-50 p-6 rounded-3xl border border-emerald-800 shadow-md flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Partner Certificato
              </span>
              <h3 className="text-base font-black text-white">★ Fornitore Consigliato da Myco</h3>
              <p className="text-xs text-emerald-200">
                Il tuo profilo è verificato. Sei visibile negli incarichi per gli investitori del circuito Private Wealth.
              </p>
            </div>
            <div className="text-2xl">🛡️</div>
          </div>
        )}

        {/* FORM SETUP PROFILO & COMPLIANCE */}
        {showProfileSetup && verificationStatus === 'UNSUBMITTED' && (
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Richiesta Accreditamento & Documenti Compliance
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Nome Studio / Ragione Sociale</label>
                <input
                  type="text"
                  placeholder="Es. Studio Notarile Rossi & Associati"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">
                  {partnerCategory === 'IMPRESA_EDILE' ? 'Upload DURC / CAR (PDF)' : 'Upload Iscrizione Albo Professionale (PDF)'}
                </label>
                <input
                  type="text"
                  placeholder="Incolla URL o carica file di verifica"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500">Specializzazione & Bio Studio</label>
                <textarea
                  rows={2}
                  placeholder="Descrivi la specializzazione dello studio e i servizi offerti..."
                  value={studioBio}
                  onChange={(e) => setStudioBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitProfile}
              className="bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-slate-800 transition"
            >
              🚀 Invia Scheda & Documenti allo Staff Myco
            </button>
          </div>
        )}

        {/* HEADER WORKSPACE DINAMICO (RUOLO RIGIDO SENZA SELETTORE) */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Workspace Operativo B2B
            </h1>
            <p className="text-xs text-slate-500">
              Categoria Certificata: <span className="font-extrabold text-slate-900 uppercase">{partnerCategory.replace('_', ' ')}</span>
            </p>
          </div>
          
          <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-3 py-1 rounded-full border border-slate-300">
            🔒 Ruolo Verificato da Admin
          </span>
        </div>

        {/* ========================================================= */}
        {/* VISTA ESCLUSIVA IMPRESA EDILE                             */}
        {/* ========================================================= */}
        {partnerCategory === 'IMPRESA_EDILE' && (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition">
                ➕ Richiedi Variazione Capitolato (Extra-Budget)
              </button>
              <button className="bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-3 rounded-xl transition border border-slate-200">
                📄 Carica Computo Metrico / Fattura SAL
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA ESCLUSIVA NOTAIO                                    */}
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
              </div>
            </div>

            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition">
              📤 Carica Bozza Rogito PDF
            </button>
          </div>
        )}

      </main>
    </div>
  );
}