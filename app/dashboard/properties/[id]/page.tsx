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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: string) => {
    const file = e.target.files?.[0];
    if (!file || !property?.id) return;
    setUploadingMedia(true);
    try {
      const filePath = `media/${property.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from('property-documents').upload(filePath, file);
      const { data: publicUrlData } = supabase.storage.from('property-documents').getPublicUrl(filePath);

      await supabase.from('property_media').insert({
        property_id: property.id,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        type: mediaType,
      });

      await fetchPropertyData(property.id);
    } finally {
      setUploadingMedia(false);
    }
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

        {/* SINTESI FINANZIARIA */}
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

        {/* GALLERIA MEDIA & SELEZIONE CONTESTUALE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Galleria Media & Valorizzazione Asset</h2>
              <p className="text-xs text-slate-500">Fotografie dello stato di fatto, rendering di progetto e shoot finale</p>
            </div>

            <button
              onClick={() => openContextualPartnerModal('FOTOGRAFO')}
              className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-400 transition shadow-sm"
            >
              📷 Ingaggia Fotografo / Home Stager
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mediaItems.length === 0 ? (
              <div className="col-span-4 py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-xs text-slate-400 italic">Nessun contenuto multimediale ancora caricato.</p>
                <label className="mt-3 cursor-pointer inline-block bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-xl">
                  {uploadingMedia ? 'Caricamento...' : '+ Carica Immagine'}
                  <input type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'POST_RESTYLING')} disabled={uploadingMedia} className="hidden" />
                </label>
              </div>
            ) : (
              mediaItems.map((item) => (
                <div key={item.id} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                  <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* CANTIERE & FISCALE */}
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

        {/* MODALE PARTNER CON DETTAGLIO / SCHEDA COMPLETA */}
        {isPartnerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200">
              
              {/* HEADER MODALE */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  {selectedPartnerDetail ? (
                    <button onClick={() => setSelectedPartnerDetail(null)} className="text-xs font-bold text-slate-500 hover:text-slate-900 mb-1">
                      ← Torna all'elenco fornitori
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Network Accreditation</span>
                  )}
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedPartnerDetail ? selectedPartnerDetail.company_name : `Fornitori ${selectedCategoryFilter || ''} su ${property.city}`}
                  </h3>
                </div>
                <button type="button" onClick={() => setIsPartnerModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-sm font-bold">✕</button>
              </div>

              {/* VISTA 1: LISTA FORNITORI CON PULSANTE "VEDI SCHEDA" */}
              {!selectedPartnerDetail && (
                <div className="space-y-3">
                  {filteredPartners.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-6 text-center">
                      Nessun partner accreditato presente per la categoria {selectedCategoryFilter} su {property.city}.
                    </p>
                  ) : (
                    filteredPartners.map((p) => (
                      <div key={p.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center gap-4">
                        <div>
                          {p.is_myco_recommended && (
                            <span className="inline-block bg-amber-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase mb-1">
                              ★ {p.badge_label || 'Myco Choice'}
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-slate-900">{p.company_name}</h4>
                          <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                            ★ {p.rating} <span className="text-slate-400 font-normal">({p.reviews_count || 12} recensioni verificate)</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setSelectedPartnerDetail(p)}
                            className="bg-white border border-slate-200 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition whitespace-nowrap"
                          >
                            Vedi Scheda & Lavori 👁️
                          </button>
                          <button
                            onClick={() => handleAssignPartner(p)}
                            disabled={assigningId === p.id}
                            className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition whitespace-nowrap"
                          >
                            {assigningId === p.id ? 'In corso...' : 'Associa subito'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* VISTA 2: SCHEDA DI DETTAGLIO FORNITORE */}
              {selectedPartnerDetail && (
                <div className="space-y-6">
                  {/* BADGE & RATING */}
                  <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      {selectedPartnerDetail.is_myco_recommended && (
                        <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                          ★ {selectedPartnerDetail.badge_label || 'Consigliato da Myco'}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedPartnerDetail.company_name}</h3>
                      <p className="text-xs text-slate-500">{selectedPartnerDetail.category} • {selectedPartnerDetail.city}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">★ {selectedPartnerDetail.rating} / 5.0</div>
                      <span className="text-[10px] text-emerald-600 font-semibold">100% Partner Verificato Myco</span>
                    </div>
                  </div>

                  {/* BIO ESTESA */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Presentazione & Competenza</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedPartnerDetail.bio_full || selectedPartnerDetail.description}
                    </p>
                  </div>

                  {/* PORTFOLIO FOTO / LAVORI */}
                  {selectedPartnerDetail.portfolio_urls && selectedPartnerDetail.portfolio_urls.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Portfolio Lavori Realizzati</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedPartnerDetail.portfolio_urls.map((url: string, i: number) => (
                          <div key={i} className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={url} alt="Portfolio Work" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TASTO AZIONE INGAGGI */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      onClick={() => setSelectedPartnerDetail(null)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition"
                    >
                      Torna Indietro
                    </button>
                    <button
                      onClick={() => handleAssignPartner(selectedPartnerDetail)}
                      disabled={assigningId === selectedPartnerDetail.id}
                      className="bg-slate-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition"
                    >
                      {assigningId === selectedPartnerDetail.id ? 'In corso...' : 'Associa & Invita all\'Asset'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}