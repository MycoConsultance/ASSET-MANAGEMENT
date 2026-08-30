'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatCurrency, LIFECYCLE_STAGES } from '@/lib/formatters';

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const supabase = createClient();

  const [property, setProperty] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Tab State Documenti
  const [docCategory, setDocCategory] = useState<'LEGALE' | 'CANTIERE' | 'FISCALE'>('LEGALE');

  // Modal Nuova Voce Capitolato/SAL (Uso esclusivo Staff)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('OPERE_EDILI');
  const [itemBudgeted, setItemBudgeted] = useState('');
  const [itemActual, setItemActual] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  const fetchPropertyData = async (propId: string) => {
    const { data: prop } = await supabase.from('properties').select('*').eq('id', propId).single();
    if (prop) setProperty(prop);

    const { data: docs } = await supabase.from('property_documents').select('*').eq('property_id', propId).order('created_at', { ascending: false });
    if (docs) setDocuments(docs);

    const { data: items } = await supabase.from('property_budget_items').select('*').eq('property_id', propId).order('created_at', { ascending: true });
    if (items) setBudgetItems(items);
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role);
      }
      await fetchPropertyData(resolvedParams.id);
      setLoading(false);
    }
    init();
  }, [resolvedParams.id, supabase]);

  const handlePhaseChange = async (newPhaseId: string) => {
    if (userRole !== 'STAFF' && userRole !== 'ADMIN') return;
    const { error } = await supabase.from('properties').update({ current_phase: newPhaseId }).eq('id', property.id);
    if (!error) await fetchPropertyData(property.id);
  };

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDescription) return;
    setSavingItem(true);

    const { error } = await supabase.from('property_budget_items').insert({
      property_id: property.id,
      category: itemCategory,
      description: itemDescription,
      budgeted_amount: parseFloat(itemBudgeted) || 0,
      actual_amount: parseFloat(itemActual) || 0,
      sal_percentage: 0,
      status: 'IN_CORSO',
    });

    if (!error) {
      setIsItemModalOpen(false);
      setItemDescription('');
      setItemBudgeted('');
      setItemActual('');
      await fetchPropertyData(property.id);
    }
    setSavingItem(false);
  };

  const handleUpdateItemSal = async (itemId: string, newSal: number) => {
    const status = newSal === 100 ? 'COMPLETATO' : newSal === 0 ? 'NON_AVVIATO' : 'IN_CORSO';
    const { error } = await supabase.from('property_budget_items').update({ sal_percentage: newSal, status }).eq('id', itemId);
    if (!error) await fetchPropertyData(property.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !property?.id) return;
    setUploading(true);
    try {
      const filePath = `${property.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from('property-documents').upload(filePath, file);
      const { data: publicUrlData } = supabase.storage.from('property-documents').getPublicUrl(filePath);
      
      await supabase.from('property_documents').insert({
        property_id: property.id,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        uploaded_by_role: userRole === 'STAFF' || userRole === 'ADMIN' ? 'STAFF' : 'INVESTOR',
        category: docCategory,
      });

      await fetchPropertyData(property.id);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">Caricamento asset...</div>;
  if (!property) return <div className="min-h-screen bg-slate-50 p-8 text-xs text-red-500 font-sans">Immobile non trovato.</div>;

  const currentPhaseId = property.current_phase || 'ACQUISTO_DEAL';
  const currentStageObj = LIFECYCLE_STAGES.find(s => s.id === currentPhaseId) || LIFECYCLE_STAGES[0];

  // Calcolo Mock/Dati Sintetici Finanziari Concierge
  const grossRent = property.monthly_rent ? property.monthly_rent * 12 : 18000;
  const managementExpenses = grossRent * 0.15; // 15% Gestione & Spese Concierge Myco
  const netBonificato = grossRent - managementExpenses;

  // Logica Countdown Anti-Sfitto (Transitorio)
  const leaseEnd = property.lease_end_date ? new Date(property.lease_end_date) : new Date(Date.now() + 45 * 24 * 60 * 60 * 1000); // Default 45 giorni per demo
  const daysToExpiration = Math.ceil((leaseEnd.getTime() - Date.now()) / (1000 * 3600 * 24));
  const isAntiVacantAlert = daysToExpiration <= 60 && daysToExpiration > 0;

  const filteredDocuments = documents.filter(doc => doc.category === docCategory || (!doc.category && docCategory === 'LEGALE'));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-6 sm:py-10 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/properties" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition">
              ← Torna al Portafoglio
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">{property.title}</h1>
            <p className="text-sm text-slate-500 font-light mt-0.5">{property.address}, {property.city}</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/properties/${property.id}/pdf`}
              target="_blank"
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-1.5"
            >
              📄 Executive Report PDF
            </a>
          </div>
        </div>

        {/* LIFECYCLE STEPPER */}
        <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] relative">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isCompleted = stage.step < currentStageObj.step;
              const isCurrent = stage.step === currentStageObj.step;
              const canClick = userRole === 'STAFF' || userRole === 'ADMIN';

              return (
                <div 
                  key={stage.id} 
                  onClick={() => canClick && handlePhaseChange(stage.id)}
                  className={`flex-1 flex flex-col items-center relative group ${canClick ? 'cursor-pointer' : ''}`}
                >
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <div className={`absolute top-4 left-[50%] w-full h-0.5 -z-0 ${stage.step < currentStageObj.step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                  <div className="z-10 flex items-center justify-center">
                    {isCompleted && <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">✓</div>}
                    {isCurrent && <div className="w-10 h-10 rounded-full bg-slate-900 text-white ring-4 ring-slate-100 flex items-center justify-center text-sm font-bold shadow-md">{stage.step}</div>}
                    {!isCompleted && !isCurrent && <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-medium">{stage.step}</div>}
                  </div>
                  <div className="mt-3 text-center">
                    <p className={`text-xs ${isCurrent ? 'font-semibold text-slate-900' : 'text-slate-500 font-normal'}`}>{stage.label}</p>
                    {isCurrent && <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">Fase Attiva</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FINANZIARIO SINTETICO CONCIERGE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Canone Incassato (Lordo)</span>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{formatCurrency(grossRent)}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Gestito da Myco Concierge</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Spese Operative & Fees</span>
            <p className="text-2xl font-semibold text-slate-600 mt-1">-{formatCurrency(managementExpenses)}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Manutenzioni & Management</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Netto Bonificato all'Investitore</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(netBonificato)}</p>
            <span className="text-[11px] text-emerald-700/70 mt-1 block font-medium">Accreditato sul tuo conto</span>
          </div>
        </div>

        {/* CARD LOCAZIONE TRANSITORIA & ALERT ANTI-SFITTO */}
        {(currentPhaseId === 'MESSA_A_REDDITO' || currentPhaseId === 'CARE_MANUTENZIONE') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Locazione Transitoria Attiva</h2>
                <p className="text-xs text-slate-500">Monitoraggio essenziale del contratto di affitto breve/transitorio</p>
              </div>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                Locato (Transitorio)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Conduttore</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">Manager In Trasferta (Corporate)</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Scadenza Contratto</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{leaseEnd.toLocaleDateString('it-IT')}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Countdown Rendita</span>
                <p className={`text-sm font-bold mt-0.5 ${isAntiVacantAlert ? 'text-amber-600' : 'text-slate-900'}`}>
                  {daysToExpiration} Giorni Rimanenti
                </p>
              </div>
            </div>

            {/* ALERT EDITORIALE ANTI-SFITTO (-60 GIORNI) */}
            {isAntiVacantAlert && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔔</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Alert Anti-Sfitto Myco (-60 Giorni)</h4>
                    <p className="text-xs text-amber-800 mt-0.5">La locazione è in scadenza. Lo Staff Myco sta già selezionando il prossimo conduttore corporate.</p>
                  </div>
                </div>
                {userRole === 'STAFF' || userRole === 'ADMIN' ? (
                  <button className="bg-amber-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-amber-800 transition whitespace-nowrap shadow-sm">
                    Avvia Ricandidatura Asset
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-amber-800 bg-amber-100/60 px-3 py-1.5 rounded-lg border border-amber-200">
                    Ricandidatura in corso dallo Staff
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODULO ANALITICO CANTIERE & SAL (Solo per Staff/Admin o fase cantiere) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Avanzamento Cantiere & SAL</h2>
              <p className="text-xs text-slate-500">Stato dei lavori e del restyling immobiliare</p>
            </div>
            {(userRole === 'STAFF' || userRole === 'ADMIN') && (
              <button
                type="button"
                onClick={() => setIsItemModalOpen(true)}
                className="bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                + Voce Capitolato
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Descrizione Lavoro</th>
                  <th className="pb-3 pr-4">Categoria</th>
                  <th className="pb-3 pr-4">Budget Previsto</th>
                  <th className="pb-3 pr-4">Stato SAL</th>
                  <th className="pb-3 text-right">Avanzamento %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {budgetItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      Nessuna voce di cantiere presente.
                    </td>
                  </tr>
                ) : (
                  budgetItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 pr-4 font-semibold text-slate-900">{item.description}</td>
                      <td className="py-3.5 pr-4">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">{formatCurrency(item.budgeted_amount)}</td>
                      <td className="py-3.5 pr-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'COMPLETATO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {(userRole === 'STAFF' || userRole === 'ADMIN') ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.sal_percentage}
                            onChange={(e) => handleUpdateItemSal(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 px-2 border border-slate-200 rounded-lg text-xs text-center font-semibold focus:outline-none focus:border-slate-900"
                          />
                        ) : (
                          <span className="font-semibold text-slate-900">{item.sal_percentage}%</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FASCICOLO DIGITALE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Fascicolo Digitale</h2>
              <p className="text-xs text-slate-500">Documentazione ufficiale custodita dal Concierge</p>
            </div>
            <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 max-w-md w-full sm:w-auto">
              <button onClick={() => setDocCategory('LEGALE')} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${docCategory === 'LEGALE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Legale & Rogiti</button>
              <button onClick={() => setDocCategory('CANTIERE')} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${docCategory === 'CANTIERE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cantiere & Tecnici</button>
              <button onClick={() => setDocCategory('FISCALE')} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${docCategory === 'FISCALE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Locazioni & Fisco</button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-slate-800 transition">
              <span>{uploading ? 'Caricamento...' : `+ Carica Documento (${docCategory})`}</span>
              <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>
          </div>

          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3 truncate pr-3">
                  <span className="text-xl">📄</span>
                  <p className="text-sm font-semibold text-slate-900 truncate">{doc.file_name}</p>
                </div>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium">Download 📄</a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}