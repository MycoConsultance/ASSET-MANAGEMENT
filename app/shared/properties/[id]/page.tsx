'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { formatCurrency, formatPhase } from '@/lib/formatters';

export default function SharedPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = createClient();

  const [property, setProperty] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [docCategory, setDocCategory] = useState<'LEGALE' | 'CANTIERE' | 'FISCALE'>('LEGALE');

  useEffect(() => {
    async function validateTokenAndLoadData() {
      if (!token) {
        setAuthorized(false);
        return;
      }

      // Validazione Token Partner nel DB
      const { data: partner } = await supabase
        .from('property_partners')
        .select('*')
        .eq('property_id', resolvedParams.id)
        .eq('access_token', token)
        .single();

      if (!partner) {
        setAuthorized(false);
        return;
      }

      setPartnerInfo(partner);
      setAuthorized(true);

      // Caricamento Dati Immobile e Documenti
      const { data: prop } = await supabase.from('properties').select('*').eq('id', resolvedParams.id).single();
      if (prop) setProperty(prop);

      const { data: docs } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', resolvedParams.id)
        .order('created_at', { ascending: false });
      if (docs) setDocuments(docs);
    }

    validateTokenAndLoadData();
  }, [resolvedParams.id, token, supabase]);

  if (authorized === null) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-sans uppercase tracking-widest">Verifica token di sicurezza...</div>;
  }

  if (authorized === false) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <span className="text-4xl">🔒</span>
          <h1 className="text-lg font-bold text-slate-900">Accesso Non Autorizzato</h1>
          <p className="text-xs text-slate-500">Il token fornito non è valido o è scaduto. Richiedi un nuovo invito allo Staff Myco.</p>
        </div>
      </main>
    );
  }

  const filteredDocuments = documents.filter(doc => doc.category === docCategory || (!doc.category && docCategory === 'LEGALE'));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOP BAR PARTNER */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Accesso Riservato Partner: {partnerInfo?.partner_role}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">{property?.title}</h1>
            <p className="text-xs text-slate-500 font-light mt-0.5">{property?.address}, {property?.city}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Fase Operativa</span>
            <span className="text-sm font-semibold text-slate-900">{formatPhase(property?.current_phase)}</span>
          </div>
        </div>

        {/* FASCICOLO DIGITALE RISERVATO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Fascicolo Condiviso Immobile</h2>
              <p className="text-xs text-slate-500">Consulta e scarica la documentazione abilitata per il tuo ruolo</p>
            </div>

            {/* Segmented Control Filtro Tab */}
            <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 max-w-md w-full sm:w-auto">
              <button
                onClick={() => setDocCategory('LEGALE')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium transition rounded-lg ${
                  docCategory === 'LEGALE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Legale & Rogiti
              </button>
              <button
                onClick={() => setDocCategory('CANTIERE')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium transition rounded-lg ${
                  docCategory === 'CANTIERE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cantiere & Tecnici
              </button>
              <button
                onClick={() => setDocCategory('FISCALE')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium transition rounded-lg ${
                  docCategory === 'FISCALE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Locazioni & Fisco
              </button>
            </div>
          </div>

          {/* Griglia Documenti Condivisi */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Nessun documento disponibile nella sezione {docCategory}.</p>
            ) : (
              filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-white transition">
                  <div className="flex items-center gap-3 truncate pr-3">
                    <span className="text-xl">📄</span>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-900 truncate">{doc.file_name}</p>
                      <span className="text-[10px] text-slate-400">Origine: {doc.uploaded_by_role}</span>
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm whitespace-nowrap min-h-[44px] flex items-center"
                  >
                    Download 📄
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}