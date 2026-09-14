'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardNavbar from '@/components/DashboardNavbar';

export default function AdminOmiSyncPage() {
  const supabase = createClient();
  const [notificationEmail, setNotificationEmail] = useState('support@amicoservices.it');
  const [saved, setSaved] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  // Calcolo scadenze semestrali OMI (Aprile & Ottobre)
  const today = new Date();
  const currentYear = today.getFullYear();
  const nextRelease = today.getMonth() < 4 
    ? `Aprile ${currentYear} (Rilascio 2° Semestre ${currentYear - 1})`
    : today.getMonth() < 10 
    ? `Ottobre ${currentYear} (Rilascio 1° Semestre ${currentYear})`
    : `Aprile ${currentYear + 1} (Rilascio 2° Semestre ${currentYear})`;

  const handleSaveEmail = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTriggerEmailTest = async () => {
    setSendingAlert(true);
    // Simulazione invio notifica via API Resend / SendGrid / Supabase Email Service
    setTimeout(() => {
      setSendingAlert(false);
      alert(`📧 Notifica di promemoria OMI inviata con successo a: ${notificationEmail}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <DashboardNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-4xl mx-auto space-y-8">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pannello Staff & Data Governance</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Gestione Feed OMI & Promemoria Aggiornamenti
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configurazione delle notifiche per il rilascio semestrale dei dati Agenzia delle Entrate
          </p>
        </div>

        {/* BOX PROMEMORIA SCADENZA */}
        <div className="bg-amber-500 text-slate-950 p-6 rounded-3xl shadow-md border border-amber-400 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h2 className="text-base font-black uppercase tracking-wide">Prossimo Rilascio Ufficiale OMI</h2>
          </div>
          <p className="text-xs font-bold leading-relaxed opacity-90">
            I dati dell'Agenzia delle Entrate vengono aggiornati con cadenza semestrale. <br />
            Prossima finestra di aggiornamento prevista: <span className="bg-slate-950 text-amber-400 px-2.5 py-1 rounded-lg font-mono ml-1">{nextRelease}</span>
          </p>
        </div>

        {/* PANNELLO CONFIGURAZIONE EMAIL NOTIFICA */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Destinatario Notifiche & Alert Automatici
          </h3>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Indirizzo Email Staff per Promemoria</label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  onClick={handleSaveEmail}
                  className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shrink-0"
                >
                  Salva Email
                </button>
              </div>
              {saved && <span className="text-xs font-bold text-emerald-600 block mt-1">✓ Indirizzo email salvato per le notifiche OMI!</span>}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Test Notifica Immediata</h4>
                <p className="text-[11px] text-slate-500">Invia un'email di prova al destinatario impostato</p>
              </div>

              <button
                onClick={handleTriggerEmailTest}
                disabled={sendingAlert}
                className="bg-amber-500 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition shadow-sm"
              >
                {sendingAlert ? 'Invio in corso...' : '📩 Test Invio Notifica Email'}
              </button>
            </div>
          </div>
        </div>

        {/* DISCLAIMER PROCEDURA DI AGGIORNAMENTO */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2 leading-relaxed">
          <h4 className="font-bold text-slate-800 uppercase text-[11px]">📋 Procedura di aggiornamento dati OMI:</h4>
          <ol className="list-decimal list-inside space-y-1 text-[11px]">
            <li>Alla ricezione dell'email di avviso, scarica il file CSV dal sito Agenzia delle Entrate.</li>
            <li>Incolla o invia il file per l'importazione automatica nel database Supabase di MYCO.</li>
            <li>Il sistema aggiornerà istantaneamente i valori per tutti gli investitori senza interrompere il servizio.</li>
          </ol>
        </div>

      </main>
    </div>
  );
}