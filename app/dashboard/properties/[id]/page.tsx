'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatCurrency, LIFECYCLE_STAGES } from '@/lib/formatters';

export const STEP_PROVIDER_MAP: Record<number, {
  title: string;
  description: string;
  actions: { role: string; label: string }[];
}> = {
  1: {
    title: "Verifica Preventiva & Due Diligence",
    description: "Analisi legale, conformità urbanistica e perizia prima della proposta d'acquisto",
    actions: [
      { role: "SCOUT_PERITO", label: "Seleziona Scout / Perito Aste" },
      { role: "GEOMETRA", label: "Seleziona Geometra (Accesso Atti)" },
      { role: "NOTAIO", label: "Seleziona Notaio (Ispezione Ipotecaria)" }
    ]
  },
  2: {
    title: "Atti & Finanziamento",
    description: "Stipula del preliminare/rogito e delibera mutuo",
    actions: [
      { role: "BROKER_MUTUI", label: "Seleziona Broker Mutui" },
      { role: "NOTAIO", label: "Conferma Notaio (Preliminare/Rogito)" }
    ]
  },
  3: {
    title: "Cantiere & Asset Staging",
    description: "Progettazione, esecuzione lavori e promozione visiva",
    actions: [
      { role: "GENERAL_CONTRACTOR", label: "Seleziona Impresa Edile" },
      { role: "ARCHITETTO", label: "Seleziona Architetto / DL" },
      { role: "HOME_STAGER", label: "Ingaggia Home Stager / Fotografo" }
    ]
  },
  4: {
    title: "Messa a Reddito & Fiscalità",
    description: "Gestione locazione, incassi e ottimizzazione fiscale",
    actions: [
      { role: "PROPERTY_MANAGER", label: "Seleziona Property Manager" },
      { role: "COMMERCIALISTA", label: "Seleziona Commercialista Partner" }
    ]
  },
  5: {
    title: "Tutela & Manutenzione",
    description: "Coperture assicurative e gestione contenziosi",
    actions: [
      { role: "BROKER_ASSICURATIVO", label: "Seleziona Broker Assicurativo" },
      { role: "LEGAL_ASSIST", label: "Richiedi Assistenza Legale 1-Click" }
    ]
  },
  6: {
    title: "Liquidazione & Exit",
    description: "Commercializzazione per la rivendita e calcolo plusvalenze",
    actions: [
      { role: "AGENTE_IMMOBILIARE", label: "Seleziona Agente Rivendita" },
      { role: "COMMERCIALISTA", label: "Calcola Plusvalenze Fiscali" }
    ]
  }
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const supabase = createClient();

  const [property, setProperty] = useState<any>(null);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [assignedPartners, setAssignedPartners] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Modal State
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [viewingPartner, setViewingPartner] = useState<any | null>(null);

  const fetchPropertyData = async (propId: string) => {
    const { data: prop } = await supabase.from('properties').select('*').eq('id', propId).single();
    if (prop) {
      setProperty(prop);
      const { data: cityPartners } = await supabase.from('partners').select('*').ilike('city', prop.city || 'Milano');
      if (cityPartners) setAllPartners(cityPartners);
    }

    const { data: items } = await supabase.from('property_budget_items').select('*').eq('property_id', propId).order('created_at', { ascending: true });
    if (items) setBudgetItems(items);

    const { data: assigned } = await supabase
      .from('property_partners')
      .select('*, partner:partner_id(*)')
      .eq('property_id', propId);
    if (assigned) setAssignedPartners(assigned);
  };

  useEffect(() => {
    async function init() {
      await fetchPropertyData(resolvedParams.id);
      setLoading(false);
    }
    init();
  }, [resolvedParams.id, supabase]);

  const openContextualPartnerModal = (role: string) => {
    setSelectedRoleFilter(role);
    setViewingPartner(null);
    setIsPartnerModalOpen(true);
  };

  const handleAssignPartner = async (partner: any) => {
    setAssigningId(partner.id);
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const { error } = await supabase.from('property_partners').insert({
      property_id: property.id,
      partner_id: partner.id,
      partner_email: partner.contact_email,
      partner_role: selectedRoleFilter || partner.category,
      access_token: token,
    });

    if (!error) {
      setIsPartnerModalOpen(false);
      setViewingPartner(null);
      await fetchPropertyData(property.id);
    }
    setAssigningId(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">Caricamento asset...</div>;
  if (!property) return <div className="min-h-screen bg-slate-50 p-8 text-xs text-red-500 font-sans">Immobile non trovato.</div>;

  const currentPhaseId = property.current_phase || 'ACQUISTO_DEAL';
  const currentStageObj = LIFECYCLE_STAGES.find(s => s.id === currentPhaseId) || LIFECYCLE_STAGES[0];
  const activeStep = currentStageObj.step || 1;

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

  const filteredPartners = selectedRoleFilter 
    ? allPartners.filter(p => p.category === selectedRoleFilter || (selectedRoleFilter === 'GENERAL_CONTRACTOR' && p.category === 'IMPRESA_EDILE') || (selectedRoleFilter === 'HOME_STAGER' && p.category === 'FOTOGRAFO'))
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
            <a href={`/api/properties/${property.id}/download-archive`} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm">
              📦 Scarica Archivio .ZIP
            </a>
            <a href={`/api/properties/${property.id}/pdf`} target="_blank" className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm">
              📄 Executive Report PDF
            </a>
          </div>
        </div>

        {/* STEPPER CICLO DI VITA */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="w-full overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] relative">
              {LIFECYCLE_STAGES.map((stage) => {
                const isCompleted = stage.step < activeStep;
                const isCurrent = stage.step === activeStep;
                return (
                  <div key={stage.id} className="flex-1 flex flex-col items-center relative">
                    <div className="z-10 flex items-center justify-center">
                      {isCompleted && <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">✓</div>}
                      {isCurrent && <div className="w-10 h-10 rounded-full bg-slate-900 text-white ring-4 ring-slate-100 flex items-center justify-center text-sm font-bold shadow-md">{stage.step}</div>}
                      {!isCompleted && !isCurrent && <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-medium">{stage.step}</div>}
                    </div>
                    <div className="mt-3 text-center">
                      <p className={`text-xs ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-500 font-normal'}`}>{stage.label}</p>
                    </div>
                  </div>
                );
              })}
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

        {/* CASCATA MODULI FORNITORI */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Piano Operativo Fornitori & Governance</h2>

          {[1, 2, 3, 4, 5, 6].map((stepNum) => {
            const stepData = STEP_PROVIDER_MAP[stepNum];
            if (!stepData) return null;

            const isActiveStep = stepNum === activeStep;
            const isPastStep = stepNum < activeStep;

            return (
              <div
                key={stepNum}
                className={`rounded-2xl p-6 transition-all duration-300 ${
                  isActiveStep
                    ? 'bg-white border-2 border-slate-900 shadow-md opacity-100'
                    : isPastStep
                    ? 'bg-white border border-slate-200 opacity-90'
                    : 'bg-slate-50 border border-dashed border-slate-300 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${isActiveStep ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                        Step {stepNum} {isActiveStep ? '• In Corso' : isPastStep ? '• Completato' : ''}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{stepData.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{stepData.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  {stepData.actions.map((act, i) => {
                    const assigned = assignedPartners.find(ap => ap.partner_role === act.role || ap.partner?.category === act.role);

                    return (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{act.role}</span>
                        
                        {assigned ? (
                          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg space-y-1">
                            <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase block w-fit">
                              Partner Attivo
                            </span>
                            <p className="text-xs font-bold text-slate-900">{assigned.partner?.company_name || assigned.partner_email}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => openContextualPartnerModal(act.role)}
                            disabled={!isActiveStep && !isPastStep}
                            className={`w-full text-xs font-bold py-2 px-3 rounded-lg transition whitespace-nowrap ${
                              isActiveStep
                                ? 'bg-slate-900 text-white hover:bg-slate-800'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {act.label}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* MODALE SELEZIONE PARTNER CON SCHEDA STUDIO RICH EXECUTIVE */}
        {isPartnerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200">
              
              {/* VISTA 1: DETTAGLIO SCHEDA STUDIO CURATA & RICCA */}
              {viewingPartner ? (
                <div className="space-y-6">
                  
                  {/* TOP HEADER STUDIO CON LOGO E BADGE */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {viewingPartner.logo_url ? (
                          <img src={viewingPartner.logo_url} alt={viewingPartner.company_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl bg-slate-900 text-white">
                            🏛️
                          </div>
                        )}
                      </div>
                      <div>
                        <button onClick={() => setViewingPartner(null)} className="text-[11px] font-bold text-amber-600 hover:underline mb-0.5 block">
                          ← Torna all'elenco fornitori
                        </button>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{viewingPartner.company_name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{viewingPartner.category} • {viewingPartner.city}</p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <span className="bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1 rounded-full border border-amber-200">
                        ★ {viewingPartner.rating || '5.0'} / 5.0
                      </span>
                      {viewingPartner.is_myco_recommended && (
                        <span className="bg-slate-900 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Partner Accreditato Myco
                        </span>
                      )}
                    </div>
                  </div>

                  {/* GRID SPECIFICHE ESPERIENZA & TEMPISTICHE */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Esperienza</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{viewingPartner.years_experience || 10} Anni</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pratiche Myco</span>
                      <p className="font-extrabold text-slate-900 mt-0.5">{viewingPartner.completed_deals_count || 28} Completate</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Risposta Media</span>
                      <p className="font-extrabold text-emerald-600 mt-0.5">&lt; {viewingPartner.avg_response_time || '12 ore'}</p>
                    </div>
                  </div>

                  {/* PRESENTAZIONE ESTESA */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Presentazione Studio</h4>
                    <p className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed font-normal">
                      {viewingPartner.bio_full || viewingPartner.description || 'Studio fiduciario selezionato per eccellenza operativa e puntualità sulle scadenze dei cantieri.'}
                    </p>
                  </div>

                  {/* LISTA SERVIZI GARANTITI */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Servizi & Competenza</h4>
                    <div className="flex flex-wrap gap-2">
                      {(viewingPartner.services_list || ['Due Diligence Aste', 'Perizie CTP', 'Analisi Urbanistica']).map((srv: string, idx: number) => (
                        <span key={idx} className="bg-slate-100 text-slate-800 font-semibold px-3 py-1 rounded-xl text-[11px] border border-slate-200">
                          ✓ {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* PORTFOLIO FOTOGRAFICO ANTEPRIMA */}
                  {viewingPartner.portfolio_photos && viewingPartner.portfolio_photos.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Progetti & Portfolio Lavori</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {viewingPartner.portfolio_photos.map((imgUrl: string, idx: number) => (
                          <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={imgUrl} alt="Portfolio Studio" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CONTATTI DIRETTI & AZIONE */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>📍 {viewingPartner.address || 'Milano, Italia'}</p>
                      <p>🌐 {viewingPartner.website || 'www.partner-myco.it'} • 📞 {viewingPartner.phone || '+39 02 890123'}</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setViewingPartner(null)}
                        className="text-xs font-bold bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 flex-1 sm:flex-initial"
                      >
                        Indietro
                      </button>
                      <button
                        onClick={() => handleAssignPartner(viewingPartner)}
                        disabled={assigningId === viewingPartner.id}
                        className="text-xs font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition flex-1 sm:flex-initial"
                      >
                        {assigningId === viewingPartner.id ? 'In corso...' : 'Associa & Invita Immediatamente'}
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                /* VISTA 2: LISTA MULTI-FORNITORE */
                <>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Seleziona {selectedRoleFilter} su {property.city}</h3>
                      <p className="text-xs text-slate-400">Fornitori accreditati nel Curated Network Myco</p>
                    </div>
                    <button type="button" onClick={() => setIsPartnerModalOpen(false)} className="text-slate-400 font-bold">✕</button>
                  </div>

                  <div className="space-y-3">
                    {filteredPartners.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Nessun partner accreditato presente per il ruolo {selectedRoleFilter} a {property.city}.</p>
                    ) : (
                      filteredPartners.map((p) => (
                        <div key={p.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-slate-300 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-400">
                              {p.logo_url ? <img src={p.logo_url} alt={p.company_name} className="w-full h-full object-cover" /> : '🏛️'}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{p.company_name}</h4>
                                {p.is_myco_recommended && (
                                  <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                                    Myco Choice
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                            <button
                              onClick={() => setViewingPartner(p)}
                              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                            >
                              👁️ Scheda Studio
                            </button>
                            <button
                              onClick={() => handleAssignPartner(p)}
                              disabled={assigningId === p.id}
                              className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
                            >
                              {assigningId === p.id ? 'In corso...' : 'Associa & Invita'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}