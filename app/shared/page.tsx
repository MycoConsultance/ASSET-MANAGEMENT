'use client';

import { useState, useEffect } from 'react';
import VendorNavbar from '@/components/VendorNavbar';
import { createClient } from '@/lib/supabase/client';

export default function VendorSharedPage() {
  const supabase = createClient();
  
  const [partnerCategory, setPartnerCategory] = useState<string>('IMPRESA_EDILE');
  const [activeCommentsDocId, setActiveCommentsDocId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  // Mock Documenti Fascicolo Condiviso (In base alla Matrice di Visibilità)
  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      title: 'Tavola Progetto Esecutivo A2.pdf',
      category: 'CANTIERE',
      uploadedBy: 'Arch. Bianchi',
      date: '12 Set 2026',
      visibleTo: ['IMPRESA_EDILE', 'TECNICO'],
      comments: [
        { id: 'c1', author: 'Impresa Edile', text: 'Richiesto chiarimento su posizione colonna di scarico bagni (Tavola A2).' }
      ]
    },
    {
      id: 'doc-2',
      title: 'Bozza Atto di Compravendita.pdf',
      category: 'LEGALE_FISCALE',
      uploadedBy: 'Studio Notarile Rossi',
      date: '10 Set 2026',
      visibleTo: ['NOTAIO', 'COMMERCIALISTA'],
      comments: []
    }
  ]);

  useEffect(() => {
    async function loadVendorInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Ruolo bloccato lato backend
        const cat = user.user_metadata?.partner_category || 'IMPRESA_EDILE';
        setPartnerCategory(cat);
      }
    }
    loadVendorInfo();
  }, [supabase]);

  const handleAddComment = (docId: string) => {
    if (!newComment.trim()) return;
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        return {
          ...doc,
          comments: [...doc.comments, { id: Date.now().toString(), author: partnerCategory.replace('_', ' '), text: newComment }]
        };
      }
      return doc;
    }));
    setNewComment('');
  };

  // Filtra documenti in base alla Matrice di Visibilità
  const visibleDocuments = documents.filter(doc => doc.visibleTo.includes(partnerCategory));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <VendorNavbar />

      <main className="py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
        
        {/* HEADER WORKSPACE (RUOLO RIGIDO BACKEND) */}
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

        {/* FASCICOLO DIGITALE CONDIVISO (SHARED VAULT) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                📁 Fascicolo Digitale Asset (Accesso Selettivo)
              </h3>
              <p className="text-xs text-slate-500">
                Documenti condivisi della tua area di competenza
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {visibleDocuments.length > 0 ? (
              visibleDocuments.map((doc) => (
                <div key={doc.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                        <span className="text-[10px] text-slate-400">Caricato da {doc.uploadedBy} • {doc.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveCommentsDocId(activeCommentsDocId === doc.id ? null : doc.id)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200"
                    >
                      💬 Note Tecniche ({doc.comments.length})
                    </button>
                  </div>

                  {/* MICRO-FEED DI NOTAZIONI TECNICHE */}
                  {activeCommentsDocId === doc.id && (
                    <div className="pt-3 border-t border-slate-200 space-y-3 pl-4">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase">Log Notazioni Tecniche</span>
                      <div className="space-y-2">
                        {doc.comments.map((c) => (
                          <div key={c.id} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                            <span className="font-bold text-slate-900 block text-[10px]">{c.author}</span>
                            <p className="text-slate-600 text-[11px] mt-0.5">{c.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Aggiungi una nota tecnica sul file..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                        />
                        <button
                          onClick={() => handleAddComment(doc.id)}
                          className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shrink-0"
                        >
                          Invia
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Nessun documento disponibile per la tua categoria.</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}