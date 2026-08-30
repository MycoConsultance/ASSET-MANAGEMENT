'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatCurrency, formatPhase, LIFECYCLE_STAGES } from '@/lib/formatters';

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const supabase = createClient();

  const [property, setProperty] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Tab State
  const [docCategory, setDocCategory] = useState<'LEGALE' | 'CANTIERE' | 'FISCALE'>('LEGALE');

  // Modal / Bottom Sheet State Invito
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerRole, setPartnerRole] = useState('NOTAIO');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Modal Nuova Voce Capitolato/SAL
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('OPERE_EDILI');
  const [itemBudgeted, setItemBudgeted] = useState('');
  const [itemActual, setItemActual] = useState('');
  const [itemSal, setItemSal] = useState('0');
  const [itemStatus, setItemStatus] = useState('IN_CORSO');
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
    if (!error) {
      await fetchPropertyData(property.id);
    } else {
      alert('Errore aggiornamento fase: ' + error.message);
    }
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
      sal_percentage: parseInt(itemSal) || 0,
      status: itemStatus,
    });

    if (!error) {
      setIsItemModalOpen(false);
      setItemDescription('');
      setItemBudgeted('');
      setItemActual('');
      setItemSal('0');
      await fetchPropertyData(property.id);
    } else {
      alert('Errore inserimento voce: ' + error.message);
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
      const { error: uploadErr } = await supabase.storage.from('property-documents').upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const { data: publicUrlData } = supabase.storage.from('property-documents').getPublicUrl(filePath);
      const roleToSave = userRole === 'STAFF' || userRole === 'ADMIN' ? 'STAFF' : 'INVESTOR';
      
      await supabase.from('property_documents').insert({
        property_id: property.id,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        uploaded_by_role: roleToSave,
        category: docCategory,
      });

      alert('Documento caricato con successo!');
      await fetchPropertyData(property.id);
    } catch (err: any) {
      alert('Errore caricamento: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">Caricamento asset...</div>;
  if (!property) return <div className="min-h-screen bg-slate-50 p-8 text-xs text-red-500 font-sans">Immobile non trovato.</div>;

  const currentPhaseId = property.current_phase || 'ACQUISTO_DEAL';
  const currentStageObj = LIFECYCLE_STAGES.find(s => s.id === currentPhaseId) || LIFECYCLE_STAGES[0];
  const isRendita = currentPhaseId === 'GESTIONE_LOCAZIONE' || currentPhaseId === 'REVIEW_EXIT';

  // Calcoli Analitici Cantiere / Budget
  const totalBudgeted = budgetItems.reduce((acc, item) => acc + Number(item.budgeted_amount || 0), 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + Number(item.actual_amount || 0), 0);
  const overallSal = budgetItems.length > 0
    ? Math.round(budgetItems.reduce((acc, item) => acc + Number(item.sal_percentage || 0), 0) / budgetItems.length)
    : 0;

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

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={`/api/properties/${property.id}/pdf`}
              target="_blank"
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-1.5"
            >
              📄 Export PDF
            </a>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition cursor-pointer"
            >
              🤝 Invita Partner
            </button>
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

        {/* GRID KPI FINANZIARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Capitale Investito</span>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{formatCurrency(property.purchase_price)}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avanzamento Cantiere (Media SAL)</span>
              <span className="text-xs font-semibold text-emerald-600">{overallSal}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${overallSal}%` }} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Budget Restyling Totale</span>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{formatCurrency(totalBudgeted)}</p>
          </div>
        </div>

        {/* MODULO ANALITICO CANTIERE & SAL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Gestione Analitica Cantiere & SAL</h2>
              <p className="text-xs text-slate-500">Capitolato e Stato Avanzamento Lavori dettagliato per voce di spesa</p>
            </div>
            {(userRole === 'STAFF' || userRole === 'ADMIN') && (
              <button
                type="button"
                onClick={() => setIsItemModalOpen(true)}
                className="bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                + Aggiungi Voce Capitolato
              </button>
            )}
          </div>

          {/* TABELLA ANALITICA CAPITOLATO */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Descrizione Lavoro</th>
                  <th className="pb-3 pr-4">Categoria</th>
                  <th className="pb-3 pr-4">Budget Previsto</th>
                  <th className="pb-3 pr-4">Costo Reale</th>
                  <th className="pb-3 pr-4 w-36">Stato SAL</th>
                  <th className="pb-3 text-right">Avanzamento %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {budgetItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Nessuna voce di capitolato inserita. Clicca su "+ Aggiungi Voce Capitolato" per iniziare.
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
                      <td className="py-3.5 pr-4">{formatCurrency(item.actual_amount)}</td>
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
              <p className="text-xs text-slate-500">Documentazione riservata dell'immobile</p>
            </div>
            <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 max-w-md w-full sm:w-auto">
              <button onClick={() => setDocCategory('LEGALE')} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${docCategory === 'LEGALE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Legale & Rogiti</button>
              <button onClick={() => setDocCategory('CANTIERE')} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${docCategory === 'CANTIERE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cantiere & Tecnici</button>
              <button onClick={() => setDocCategory('FISCALE')} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${docCategory === 'FISCALE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Locazioni & Fisco</button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-slate-800 transition">
              <span>{uploading ? 'Caricamento...' : `+ Carica Documento in (${docCategory})`}</span>
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

        {/* MODALE AGGIUNGI VOCE CAPITOLATO */}
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-md space-y-4 border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase">Nuova Voce Capitolato</h3>
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="text-slate-400 text-sm">✕</button>
              </div>

              <form onSubmit={handleAddBudgetItem} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Descrizione Lavoro</label>
                  <input type="text" required value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="es. Impianto Elettrico Sfilabile" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Categoria</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="OPERE_EDILI">Opere Edili</option>
                    <option value="IMPIANTI">Impianti & Tecnologie</option>
                    <option value="FINITURE">Finiture & Rivestimenti</option>
                    <option value="PROFESSIONISTI">Professionisti & Onorari</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Budget Previsto (€)</label>
                    <input type="number" value={itemBudgeted} onChange={(e) => setItemBudgeted(e.target.value)} placeholder="8000" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Costo Reale (€)</label>
                    <input type="number" value={itemActual} onChange={(e) => setItemActual(e.target.value)} placeholder="8200" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsItemModalOpen(false)} className="h-10 px-4 border border-slate-200 text-xs rounded-xl">Annulla</button>
                  <button type="submit" disabled={savingItem} className="h-10 px-5 bg-slate-900 text-white text-xs font-medium rounded-xl">Salva Voce</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}