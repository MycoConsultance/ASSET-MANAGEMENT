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
  const [owners, setOwners] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isLatePayment, setIsLatePayment] = useState(false);

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

    const { data: ownerData } = await supabase.from('property_owners').select('*, profile:user_id(*)').eq('property_id', propId);
    if (ownerData) setOwners(ownerData);

    const { data: quoteData } = await supabase.from('property_quotes').select('*, partner:partner_id(*)').eq('property_id', propId);
    if (quoteData) setQuotes(quoteData);
  };

  useEffect(() => {
    async function init() {
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

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">Caricamento asset...</div>;
  if (!property) return <div className="min-h-screen bg-slate-50 p-8 text-xs text-red-500 font-sans">Immobile non trovato.</div>;

  const currentPhaseId = property.current_phase || 'ACQUISTO_DEAL';
  const currentStageObj = LIFECYCLE_STAGES.find(s => s.id === currentPhaseId) || LIFECYCLE_STAGES[0];

  const monthlyRent = Number(property.monthly_rent || 0);
  const grossRentAnnual = monthlyRent * 12;

  // 4.1 CALCOLATORE FISCALE CONTESTUALE (CEDOLARE SECCA)
  const taxAgevolata10 = grossRentAnnual * 0.10;
  const taxOrdinaria21 = grossRentAnnual * 0.21;

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
              href={`/api/properties/${property.id}/download-archive`}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
            >
              📦 Scarica Archivio .ZIP
            </a>
            <a
              href={`/api/properties/${property.id}/pdf`}
              target="_blank"
              className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
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

        {/* 2.1 ASSET OWNERSHIP & CO-PROPRIETÀ WIDGET */}
        {owners.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asset Ownership & Co-Proprietà</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {owners.map(o => (
                <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{o.profile?.full_name || 'Socio / Inintestatario'}</span>
                    <span className="text-[10px] text-slate-400">{o.is_primary_contact ? 'Referente Principale' : 'Co-Proprietario'}</span>
                  </div>
                  <span className="font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">{o.ownership_percentage}%</span>
                </div>
              ))}
            </div>
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

        {/* 4.1 CALCOLATORE FISCALE CONTESTUALE (CEDOLARE SECCA) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stima Imposta & Regime Fiscale</h2>
              <p className="text-xs text-slate-500">Proiezione imposte sul canone annuo maturo ({formatCurrency(grossRentAnnual)})</p>
            </div>
            <span className="bg-slate-100 text-slate-900 font-bold text-xs px-3 py-1 rounded-lg">Persona Fisica</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Cedolare Agevolata (10%)</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(taxAgevolata10)}/anno</p>
              <span className="text-[10px] text-slate-400 block mt-1">Valida per contratti transitori / canone concordato</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Cedolare Ordinaria (21%)</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(taxOrdinaria21)}/anno</p>
              <span className="text-[10px] text-slate-400 block mt-1">Valida per regime libero 4+4 o affittacamere</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex justify-between items-center">
            <span>Stai applicando la cedolare agevolata al 10%? Richiedi la verifica dei requisiti con il Commercialista.</span>
            <button onClick={() => openContextualPartnerModal('COMMERCIALISTA')} className="bg-amber-500 text-slate-950 font-bold text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap ml-2">
              Verifica con Commercialista
            </button>
          </div>
        </div>

        {/* 4.2 TRACCIAMENTO MOROSITÀ & TUTELA LEGALE 1-CLICK */}
        <div className={`rounded-2xl border p-6 shadow-sm space-y-4 transition ${isLatePayment ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-base font-bold ${isLatePayment ? 'text-red-900' : 'text-slate-900'}`}>Stato Incasso Locazione Transitoria</h2>
              <p className="text-xs text-slate-500">Monitoraggio regolarità canoni conduttore corporate</p>
            </div>
            <button
              onClick={() => setIsLatePayment(!isLatePayment)}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-900 uppercase underline"
            >
              Simula Stato {isLatePayment ? 'Regolare' : 'In Ritardo'}
            </button>
          </div>

          {isLatePayment && (
            <div className="p-4 bg-white rounded-xl border border-red-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                ⚠️ Segnalato ritardo nel pagamento del canone mensile.
              </div>
              <button
                onClick={() => openContextualPartnerModal('COMMERCIALISTA')}
                className="w-full sm:w-auto bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-red-700 transition"
              >
                ⚖️ Richiedi Assistenza Legale / Tutela Morosità 1-Click
              </button>
            </div>
          )}
        </div>

        {/* SEZIONI FORNITORI CONTESTUALI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Avanzamento Cantiere & SAL</h2>
            <p className="text-xs text-slate-500">Seleziona un'impresa qualificata per il restyling</p>
          </div>
          <button onClick={() => openContextualPartnerModal('IMPRESA_EDILE')} className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl">
            🛠️ Seleziona Impresa Edile
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
                    <button onClick={() => handleAssignPartner(p)} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 parent-xl">
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