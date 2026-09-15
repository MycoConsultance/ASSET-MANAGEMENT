'use client';

import { useState } from 'react';
import VendorNavbar from '@/components/VendorNavbar';

export default function VendorSharedPage() {
  const [salProgress, setSalProgress] = useState(65);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Timeline Milestones Operative
  const [milestones, setMilestones] = useState([
    { id: 'm1', label: 'Demolizioni & Tramezzi', status: 'COMPLETED' },
    { id: 'm2', label: 'Posa Impianti & Massetto', status: 'IN_PROGRESS' },
    { id: 'm3', label: 'Finiture & Tinteggiatura', status: 'WAITING' },
  ]);

  // Diario Fotografico & Video SAL
  const [salPhotos, setSalPhotos] = useState([
    { id: 'p1', title: 'Impianto Idraulico Bagno', date: '14 Set 2026', tag: 'Impianti', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80' },
    { id: 'p2', title: 'Tramezzature Soggiorno', date: '08 Set 2026', tag: 'Murature', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80' },
  ]);

  // Log Notazioni
  const [comments, setComments] = useState([
    { id: 'c1', author: 'EdilCostruzioni Srl', text: 'Richiesto chiarimento su posizione colonna di scarico bagni (Tavola A2).' }
  ]);

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === 'COMPLETED' ? 'IN_PROGRESS' : m.status === 'IN_PROGRESS' ? 'WAITING' : 'COMPLETED';
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, { id: Date.now().toString(), author: 'EdilCostruzioni Srl', text: newComment }]);
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased relative">
      <VendorNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* 1. HEADER ASSET & PROFILO PARTNER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-amber-400 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                  EdilCostruzioni Srl
                </span>
                <span className="text-xs text-slate-500 font-bold">• Category: IMPRESA EDILE</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Bilocale Garibaldi
                </h1>
                
                {/* BUTTON MODAL SLIDE-OVER SCHEDA TECNICA & ACCESSI */}
                <button
                  onClick={() => setShowAccessModal(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  📐 Scheda Asset & Accessi
                </button>
              </div>

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

        {/* 2. BANNER COLLI DI BOTTIGLIA */}
        <div className="bg-blue-950 text-white p-5 rounded-3xl border border-blue-800 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="bg-blue-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Stato Pratica & Colli di Bottiglia
            </span>
            <h3 className="text-sm font-black text-white">
              ⏳ In Attesa Risposta: Arch. Stefano Bianchi (Direttore Lavori)
            </h3>
            <p className="text-xs text-blue-200 max-w-2xl">
              La pratica cantiere è in attesa del chiarimento sulla quota dello scarico bagni. Nota inserita il 12 Set 2026.
            </p>
          </div>

          <div className="bg-blue-900/60 p-3 rounded-2xl border border-blue-700/60 text-right shrink-0">
            <span className="text-[10px] text-blue-300 font-bold uppercase block">Prossimo Sblocco</span>
            <span className="text-xs font-black text-amber-400">FASE 4: Messa a Reddito & Shooting</span>
          </div>
        </div>

        {/* GRID PRINCIPALE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* 3. ACTION MODULE & MINI-TIMELINE MILESTONES */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    🏗️ Modulo Operativo SAL & Milestones Cantiere
                  </h3>
                  <p className="text-xs text-slate-500">Aggiorna lo stato di avanzamento e spunta le macro-fasi</p>
                </div>
              </div>

              {/* SLIDER SAL */}
              <div className="space-y-3">
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

              {/* MINI-TIMELINE MILESTONES OPERATIVE */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Milestones Operative Cantiere
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleMilestone(m.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-2.5 ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : m.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={m.status === 'COMPLETED'}
                        readOnly
                        className="accent-emerald-600 rounded w-4 h-4"
                      />
                      <div className="leading-tight">
                        <span className="text-[11px] font-extrabold block">{m.label}</span>
                        <span className="text-[9px] font-bold uppercase opacity-75">
                          {m.status === 'COMPLETED' ? 'Completato' : m.status === 'IN_PROGRESS' ? 'In Corso' : 'In Attesa'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition">
                  ➕ Richiedi Variazione Capitolato (Extra-Budget)
                </button>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-3 rounded-xl transition border border-slate-200">
                  📄 Upload Computo Metrico / Fattura SAL
                </button>
              </div>
            </div>

            {/* 4. DIARIO FOTOGRAFICO & VIDEO SAL */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    📷 Diario Fotografico & Video SAL
                  </h3>
                  <p className="text-xs text-slate-500">Le foto caricate qui aggiornano automaticamente la vista dell'investitore</p>
                </div>
                <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
                  + Carica Foto/Video
                </button>
              </div>

              {/* GALLERIA CRONOLOGICA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {salPhotos.map((photo) => (
                  <div key={photo.id} className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={photo.url} alt={photo.title} className="w-full h-36 object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 flex flex-col justify-end text-white">
                      <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md w-max uppercase mb-1">
                        {photo.tag}
                      </span>
                      <h4 className="text-xs font-bold">{photo.title}</h4>
                      <span className="text-[10px] text-slate-300 font-mono">{photo.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. FASCICOLO DIGITALE & NOTE */}
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

          {/* 6. SIDEBAR TEAM */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  👥 Team di Progetto Asset
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Interlocutori abilitati allo scambio note & atti</p>
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

      {/* MODAL SLIDE-OVER: SCHEDA TECNICA & ACCESSI CANTIERE */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Specifiche Immobile</span>
                  <h3 className="text-lg font-black text-slate-900">Scheda Tecnica & Accessi</h3>
                </div>
                <button
                  onClick={() => setShowAccessModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* SEZIONE 1: CARATTERISTICHE IMMOBILE */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">🏢 Dettagli Fabbricato</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Superficie</span>
                    <span className="font-extrabold text-slate-900 font-mono">65 MQ Totali</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Piano & Ascensore</span>
                    <span className="font-extrabold text-slate-900">3° Piano (Sì Ascensore)</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Utenze Cantiere</span>
                    <span className="font-extrabold text-emerald-600">⚡ Luce e Acqua Attive per Cantiere</span>
                  </div>
                </div>
              </div>

              {/* SEZIONE 2: CREDENZIALI E ISTRUZIONI ACCESSO */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">🔑 Accesso Cantiere & Keybox</h4>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Codice Keybox Portoncino:</span>
                    <span className="font-mono font-black text-sm bg-amber-200/80 px-2.5 py-0.5 rounded-lg text-slate-900">4829#</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-amber-200/60">
                    La keybox si trova a sinistra del portone al civico 8. Contiene la chiave del portoncino e dell'appartamento al 3° piano.
                  </p>
                </div>
              </div>

              {/* SEZIONE 3: ZTL E ORARI SCARICO */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">🚚 Orari Scarico Merci & ZTL</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-800">Zona Area C / ZTL Milano Centro</p>
                  <p className="text-slate-500 text-[11px]">
                    Accesso consentito ai mezzi da lavoro previa registrazione targa o prima delle 07:30. Orari rumore cantiere consentiti: <strong className="text-slate-900">08:00 - 12:30 / 14:00 - 18:00</strong>.
                  </p>
                </div>
              </div>

            </div>

            <button
              onClick={() => setShowAccessModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition"
            >
              Chiudi Scheda
            </button>
          </div>
        </div>
      )}

    </div>
  );
}