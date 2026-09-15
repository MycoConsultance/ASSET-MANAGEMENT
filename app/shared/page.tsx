'use client';

import { useState } from 'react';
import VendorNavbar from '@/components/VendorNavbar';

export default function VendorSharedPage() {
  const [salProgress, setSalProgress] = useState(65);
  const [newComment, setNewComment] = useState('');

  // Mock Notazione Tecnica Cantiere
  const [comments, setComments] = useState([
    { id: '1', author: 'Impresa Edile', text: 'Richiesto chiarimento su posizione colonna di scarico bagni (Tavola A2).' }
  ]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, { id: Date.now().toString(), author: 'Impresa Edile', text: newComment }]);
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <VendorNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* 1. HEADER CONTESTO IMMOBILE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-amber-400 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                  EdilCostruzioni Srl
                </span>
                <span className="text-xs text-slate-500 font-bold">• Category: IMPRESA EDILE</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Bilocale Garibaldi
              </h1>
              <p className="text-xs font-mono text-slate-500">
                📍 Via San Carpoforo 8, Milano (MI)
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 shrink-0">
              <div className="space-y-0.5">
                <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase">
                  FASE 3: CANTIERE & RESTYLING
                </span>
                <p className="text-xs font-bold text-slate-700">
                  Target Consegna: <span className="font-mono text-slate-900">28 Nov 2026</span>
                </p>
              </div>

              <div className="text-right border-l border-amber-200 pl-4 font-mono">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">SAL Attuale</span>
                <span className="text-xl font-black text-amber-600">{salProgress}%</span>
              </div>
            </div>

          </div>
        </div>

        {/* 2. BANNER OPERATIVO: "CHI STA FERMANDO LA PRATICA?" */}
        <div className="bg-blue-950 text-white p-5 rounded-3xl border border-blue-800 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="bg-blue-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Stato Pratica & Colli di Bottiglia
            </span>
            <h3 className="text-sm font-black text-white">
              ⏳ In Attesa Risposta: Arch. Stefano Bianchi (Direttore Lavori)
            </h3>
            <p className="text-xs text-blue-200 max-w-2xl">
              La pratica cantiere è momentaneamente in attesa del chiarimento sulla quota dello scarico bagni. L'Impresa ha inserito la nota tecnica in data 12 Set 2026.
            </p>
          </div>

          <div className="bg-blue-900/60 p-3 rounded-2xl border border-blue-700/60 text-right shrink-0">
            <span className="text-[10px] text-blue-300 font-bold uppercase block">Prossimo Sblocco</span>
            <span className="text-xs font-black text-amber-400">FASE 4: Messa a Reddito & Shooting</span>
          </div>
        </div>

        {/* LAYOUT GRID: ACTION MODULE + TEAM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* 3. ACTION MODULE IMPRESA EDILE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    🏗️ Modulo Operativo SAL Cantiere
                  </h3>
                  <p className="text-xs text-slate-500">Aggiorna lo stato di avanzamento o invia extra-budget</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-700 uppercase">Avanzamento Opere (%)</span>
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
                  📄 Upload Computo / Fattura SAL
                </button>
              </div>
            </div>

            {/* 4. FASCICOLO DIGITALE & NOTE */}
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
                  <div className="space-y-2">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-900 text-[10px] block">{c.author}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5">{c.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Scrivi notazione tecnica su questo file..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                    />
                    <button onClick={handleAddComment} className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                      Invia
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 5. SIDEBAR TEAM DI PROGETTO */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  👥 Team di Progetto Asset
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Interlocutori abilitati allo scambio note & atti
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="bg-amber-500 text-slate-950 font-black text-[10px] w-8 h-8 rounded-xl flex items-center justify-center">
                    MYCO
                  </div>
                  <div>
                    <span className="text-xs font-extrabold block">Staff Myco Concierge</span>
                    <span className="text-[10px] text-amber-400 font-bold">⚙️ Regia Operativa</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                  <span className="text-base">📐</span>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Arch. Stefano Bianchi</span>
                    <span className="text-[10px] text-slate-500 font-bold">Direttore Lavori / Progettista</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}