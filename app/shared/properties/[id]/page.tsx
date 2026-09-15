'use client';

import { useState } from 'react';
import VendorNavbar from '@/components/VendorNavbar';

export default function SharedAssetDetailPage() {
  const [activeTab, setActiveTab] = useState<'DOCUMENTI' | 'SAL'>('DOCUMENTI');
  const [newComment, setNewComment] = useState('');

  // Mock Documenti con Micro-Feed Note Contestuali
  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      title: 'Tavola Progetto Esecutivo A2.pdf',
      category: 'CANTIERE',
      uploadedBy: 'Arch. Stefano Bianchi',
      date: '12 Set 2026',
      comments: [
        { id: 'c1', author: 'EdilCostruzioni Srl', text: 'Richiesto chiarimento su posizione colonna di scarico bagni (Tavola A2).' },
        { id: 'c2', author: 'Arch. Stefano Bianchi', text: 'Verificato. Allegata revisione quota scarichi al piano.' }
      ]
    },
    {
      id: 'doc-2',
      title: 'CILA e Relazione Tecnica Asseverata.pdf',
      category: 'PRATICHE',
      uploadedBy: 'Geom. Marco Verdi',
      date: '05 Set 2026',
      comments: []
    }
  ]);

  const handleAddComment = (docId: string) => {
    if (!newComment.trim()) return;
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        return {
          ...doc,
          comments: [...doc.comments, { id: Date.now().toString(), author: 'EdilCostruzioni Srl', text: newComment }]
        };
      }
      return doc;
    }));
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <VendorNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* 1. HEADER ASSET & PROFILO FORNITORE (TOP BAR) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-amber-400 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                  EdilCostruzioni Srl
                </span>
                <span className="text-xs text-slate-400 font-medium">• General Contractor Certificato</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Bilocale Garibaldi
              </h1>
              <p className="text-xs font-mono text-slate-500">
                📍 Via San Carpoforo 8, Milano (MI)
              </p>
            </div>

            {/* BADGE FASE & SAL */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shrink-0">
              <div className="space-y-0.5">
                <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase">
                  Fase 3: Cantiere & Restyling
                </span>
                <p className="text-xs font-bold text-slate-700">Consegna: <span className="font-mono text-slate-900">28 Nov 2026</span></p>
              </div>

              <div className="text-right border-l border-slate-200 pl-4 font-mono">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Stato SAL</span>
                <span className="text-xl font-black text-amber-600">65%</span>
              </div>
            </div>

          </div>
        </div>

        {/* LAYOUT PRINCIPALE GRID (CONTENUTI + SIDEBAR TEAM) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLONNA PRINCIPALE (2/3): FASCICOLO & NOTE TECNICHE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* TABS NAVIGAZIONE B2B */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('DOCUMENTI')}
                className={`text-xs font-extrabold px-4 py-2 rounded-xl transition ${
                  activeTab === 'DOCUMENTI'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                📁 Fascicolo Digitale Asset
              </button>
              <button
                onClick={() => setActiveTab('SAL')}
                className={`text-xs font-extrabold px-4 py-2 rounded-xl transition ${
                  activeTab === 'SAL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                🏗️ Modulo SAL Cantiere
              </button>
            </div>

            {/* VISTA FASCICOLO & MICRO-FEED */}
            {activeTab === 'DOCUMENTI' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Documentazione Tecnica di Cantiere
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Accesso Selettivo Partner</span>
                </div>

                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📄</span>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">{doc.title}</h4>
                            <span className="text-[10px] text-slate-400">Caricato da {doc.uploadedBy} • {doc.date}</span>
                          </div>
                        </div>

                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {doc.category}
                        </span>
                      </div>

                      {/* MICRO-FEED NOTE CONTESTUALI TRACCIATE */}
                      <div className="pt-3 border-t border-slate-200 space-y-2.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                          Log Notazioni Tecniche
                        </span>

                        <div className="space-y-2">
                          {doc.comments.map((c) => (
                            <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                              <span className="font-extrabold text-slate-900 text-[10px] block">{c.author}</span>
                              <p className="text-slate-600 text-[11px] mt-0.5">{c.text}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Aggiungi una notifica o nota tecnica su questo file..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                          />
                          <button
                            onClick={() => handleAddComment(doc.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 transition"
                          >
                            Invia
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA MODULO SAL */}
            {activeTab === 'SAL' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Aggiornamento SAL & Varianti Capitolato
                </h3>
                <p className="text-xs text-slate-500">
                  Modulo operativo riservato all'Impresa Edile per l'aggiornamento avanzamento opere.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block">Avanzamento Corrente: 65%</span>
                  <div className="w-full bg-slate-200 h-3 rounded-full mt-2 overflow-hidden">
                    <div className="bg-amber-500 h-full w-[65%]"></div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 2. WIDGET SIDEBAR: TEAM DI PROGETTO (INTERLOCUTORI ABILITATI) */}
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
                
                {/* MYCO CONCIERGE STAFF */}
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="bg-amber-500 text-slate-950 font-black text-[10px] w-8 h-8 rounded-xl flex items-center justify-center">
                    MYCO
                  </div>
                  <div>
                    <span className="text-xs font-extrabold block">Staff Myco Concierge</span>
                    <span className="text-[10px] text-amber-400 font-bold">⚙️ Regia Operativa & Oversight</span>
                  </div>
                </div>

                {/* ARCHITETTO / DIRETTORE LAVORI */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="bg-slate-200 text-slate-700 font-bold text-xs w-8 h-8 rounded-xl flex items-center justify-center">
                    📐
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Arch. Stefano Bianchi</span>
                    <span className="text-[10px] text-slate-500 font-bold">Direttore Lavori / Progettista</span>
                  </div>
                </div>

                {/* GEOMETRA / PRATICHE CATASTALI */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="bg-slate-200 text-slate-700 font-bold text-xs w-8 h-8 rounded-xl flex items-center justify-center">
                    📏
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Geom. Marco Verdi</span>
                    <span className="text-[10px] text-slate-500 font-bold">Pratiche Catastali & CILA</span>
                  </div>
                </div>

              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  🔒 Note e file inviati in questo ambiente sono condivisi esclusivamente con il team di questo asset.
                </p>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}