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
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Modal Partner State
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<any | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchPropertyData = async (propId: string) => {
    const { data: prop } = await supabase.from('properties').select('*').eq('id', propId).single();
    if (prop) {
      setProperty(prop);
      const { data: cityPartners } = await supabase.from('partners').select('*').ilike('city', prop.city || 'Milano');
      if (cityPartners) setAllPartners(cityPartners);
    }

    const { data: docs } = await supabase.from('property_documents').select('*').eq('property_id', propId).order('created_at', { ascending: false });
    if (docs) setDocuments(docs);

    const { data: items } = await supabase.from('property_budget_items').select('*').eq('property_id', propId).order('created_at', { ascending: true });
    if (items) setBudgetItems(items);

    const { data: media } = await supabase.from('property_media').select('*').eq('property_id', propId).order('created_at', { ascending: false });
    if (media) setMediaItems(media);

    const { data: logData } = await supabase.from('property_logs').select('*').eq('property_id', propId).order('created_at', { ascending: false });
    if (logData) setLogs(logData);

    const { data: deadlineData } = await supabase.from('property_deadlines').select('*').eq('property_id', propId).order('due_date', { ascending: true });
    if (deadlineData) setDeadlines(deadlineData);
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

  const openContextualPartnerModal = (category: string) => {
    setSelectedCategoryFilter(category);
    setSelectedPartnerDetail(null);
    setIsPartnerModalOpen(true);
  };

  const handleAssignPartner = async (partner: any) => {
    setAssigningId(partner.id);
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const { error } = await supabase.from('property_partners').insert({
      property_id: property.id,
      partner_id: partner.id,
      partner_email: partner.contact_email,
      partner_role: partner.category,
      access_token: token,
    });

    if (!error) {
      setIsPartnerModalOpen(false);
      setSelectedPartnerDetail(null);
      await fetchPropertyData(property.id);
    }
    setAssigningId(null);
  };

  // APPROVAZIONE VARIAZIONE CAPITOLATO (EXTRA-BUDGET)
  const handleApproveVariance = async (itemId: string) => {
    await supabase.from('property_budget_items').update({ variance_status: 'APPROVED' }).eq('id', itemId);
    await fetchPropertyData(property.id);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">Caricamento asset...</div>;
  if (!property) return <div className="min-h-screen bg-slate-50 p-8 text-xs text-red-500 font-sans">Immobile non trovato.</div>;

  const currentPhaseId = property.current_phase || 'ACQUISTO_DEAL';
  const currentStageObj = LIFECYCLE_STAGES.find(s => s.id === currentPhaseId) || LIFECYCLE_STAGES[0];

  const pendingVariances = budgetItems.filter(i => i.is_variance && i.variance_status === 'PENDING_APPROVAL');

  const monthlyRent = Number(property.monthly_rent || 0);
  const grossRentAnnual = monthlyRent * 12;
  const managementExpensesAnnual = Number(property.management_fees || (grossRentAnnual * 0.15));
  const netRentAnnual = grossRentAnnual - managementExpensesAnnual;

  const acquisitionCost = Number(property.price || 150000);
  const restylingCost = budgetItems.reduce((acc, item) => acc + Number(item.budgeted_amount || 0), 0);
  const totalCapitalInvested = acquisitionCost + restylingCost;

  const realRoiNetPercent = totalCapitalInvested > 0 && netRentAnnual > 0 
    ? ((netRentAnnual / totalCapitalInvested) * 100).toFixed(2)
    : '0.00';

  const filteredPartners = selectedCategoryFilter 
    ? allPartners.filter(p => p.category === selectedCategoryFilter)
    : allPartners;

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

        {/* STEPPER CICLO DI VITA */}
        <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] relative">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isCompleted = stage.step < currentStageObj.step;
              const isCurrent = stage.step === currentStageObj.step;
              return (
                <div key={stage.id} className="flex-1 flex flex-col items-center relative">
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. CARD APPROVAZIONE EXTRA-BUDGET (VARIAZIONE CAPITOLATO) */}
        {pendingVariances.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                Approvazione Richiesta • Validata da Myco
              </span>
            </div>
            {pendingVariances.map((varItem) => (
              <div key={varItem.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-amber-200 gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{varItem.description}</h4>
                  <p className="text-xs text-slate-500">{varItem.variance_reason || 'Variazione di cantiere necessaria'}</p>
                  <span className="text-xs font-bold text-amber-700 mt-1 block">Importo: +{formatCurrency(varItem.budgeted_amount)}</span>
                </div>
                <button
                  onClick={() => handleApproveVariance(varItem.id)}
                  className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm whitespace-nowrap"
                >
                  Approva Variazione 1-Click
                </button>
              </div>
            ))}
          </div>
        )}

        {/* METRICHE FINANZIARIE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Capitale Investito</span>
            <p className="text-xl font-semibold text-slate-900 mt-1">{formatCurrency(totalCapitalInvested)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Canone Incassato</span>
            <p className="text-xl font-semibold text-slate-900 mt-1">{formatCurrency(grossRentAnnual)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Netto Bonificato</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(netRentAnnual)}</p>
          </div>
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">ROI Netto Reale %</span>
            <p className="text-2xl font-black text-white mt-1">{realRoiNetPercent}%</p>
          </div>
        </div>

        {/* 4. BLOCCO WIDGET: PROSSIME SCADENZE & LOG DI BORDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* WIDGET PROSSIME SCADENZE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">🗓️ Prossime Scadenze Imminenti</h3>
              <p className="text-xs text-slate-500">I 3 eventi chiave programmati per questo asset</p>
            </div>
            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nessuna scadenza in programma.</p>
              ) : (
                deadlines.slice(0, 3).map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{d.title}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{d.category}</span>
                    </div>
                    <span className="bg-slate-900 text-white font-mono font-bold px-2.5 py-1 rounded-lg text-[11px]">
                      {new Date(d.due_date).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WIDGET LOG DI BORDO */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">📋 Log di Bordo (Feed Sola Lettura)</h3>
              <p className="text-xs text-slate-500">Tracciabilità storica delle attività per la massima trasparenza</p>
            </div>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nessuna attività registrata nel log.</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="text-xs border-b border-slate-100 pb-2 flex justify-between items-start">
                    <span className="text-slate-700 font-medium">{l.event_title}</span>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-2">
                      {new Date(l.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* GALLERIA MEDIA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Galleria Media & Valorizzazione Asset</h2>
              <p className="text-xs text-slate-500">Fotografie dello stato di fatto, rendering di progetto e shoot finale</p>
            </div>
            <button onClick={() => openContextualPartnerModal('FOTOGRAFO')} className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl">
              📷 Ingaggia Fotografo / Home Stager
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* SEZIONI CONTESTUALI FORNITORI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Avanzamento Cantiere & SAL</h2>
            <p className="text-xs text-slate-500">Seleziona un'impresa qualificata per il restyling</p>
          </div>
          <button onClick={() => openContextualPartnerModal('IMPRESA_EDILE')} className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl">
            🛠️ Seleziona Impresa Edile
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Fascicolo Fiscale & Contabilità</h2>
            <p className="text-xs text-slate-500">Gestione tributaria con commercialisti certificati</p>
          </div>
          <button onClick={() => openContextualPartnerModal('COMMERCIALISTA')} className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl">
            💼 Seleziona Commercialista Partner
          </button>
        </div>

        {/* MODALE PARTNER */}
        {isPartnerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Fornitori {selectedCategoryFilter} su {property.city}</h3>
                <button type="button" onClick={() => setIsPartnerModalOpen(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <div className="space-y-3">
                {filteredPartners.map((p) => (
                  <div key={p.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.company_name}</h4>
                      <p className="text-xs text-slate-500">{p.description}</p>
                    </div>
                    <button onClick={() => handleAssignPartner(p)} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">
                      Associa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}