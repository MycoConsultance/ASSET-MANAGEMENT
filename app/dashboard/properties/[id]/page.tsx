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

  const [loading, setLoading] = useState(true);

  // Modal Partner State
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
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

  // Calcolo giorni fase
  const today = new Date();
  const startDate = property.phase_start_date ? new Date(property.phase_start_date) : new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000);
  const endDate = property.phase_estimated_end_date ? new Date(property.phase_estimated_end_date) : new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000);

  const daysPassed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
  const progressPercent = property.phase_progress_percent || 75;

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
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
            >
              📦 Scarica Archivio .ZIP
            </a>
            <a
              href={`/api/properties/${property.id}/pdf`}
              target="_blank"
              className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
            >
              📄 Executive Report PDF
            </a>
          </div>
        </div>

        {/* 2. LIFECYCLE STEPPER ESTESO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="w-full overflow-x-auto">
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

          {/* WIDGET DETTAGLIO FASE ATTIVA */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">
                  Fase Attiva • {currentStageObj.label}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">Avanzamento Operativo & Tempistiche</h3>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Inizio: <strong>{startDate.toLocaleDateString('it-IT')}</strong> — Fine Stimata: <strong>{endDate.toLocaleDateString('it-IT')}</strong>
              </div>
            </div>

            {/* PROGRESS BAR & COUNTDOWN */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700">Avanzamento Lavori: {progressPercent}%</span>
                <span className="text-amber-700">Attivo da {daysPassed} giorni • Consegna tra {daysRemaining} giorni</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div className="bg-slate-900 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

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