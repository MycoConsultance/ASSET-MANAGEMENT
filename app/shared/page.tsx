'use client';

import VendorNavbar from '@/components/VendorNavbar';

export default function VendorSharedPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <VendorNavbar />

      <main className="py-10 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="inline-block bg-amber-100 text-amber-900 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
            Area Riservata B2B Partner
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Workspace Fornitore & Collaboratori
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Benvenuto nel portale segregato MYCO. Da questa sezione puoi accedere esclusivamente ai cantieri, alle pratiche edilizie, ai documenti catastali o alla due diligence assegnati direttamente al tuo account.
          </p>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">📊 Cantieri e SAL Attivi</span>
              <p className="text-[11px] text-slate-500">
                Aggiorna lo Stato Avanzamento Lavori o carica i computi metrici per gli immobili associati.
              </p>
              <span className="inline-block text-[10px] font-bold text-amber-600">In attesa di assegnazione asset</span>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">📁 Documentazione & Pratiche</span>
              <p className="text-[11px] text-slate-500">
                Invia o consulta visure, contratti e documentazione tecnica in ambiente sicuro.
              </p>
              <span className="inline-block text-[10px] font-bold text-slate-400">Nessun documento richiesto</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}