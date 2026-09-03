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
  const [assignedPartners, setAssignedPartners] = useState<any[]>([]);
  const [allPartners, setAllPartners] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  const [docCategory, setDocCategory] = useState<'LEGALE' | 'CANTIERE' | 'FISCALE'>('LEGALE');

  // Modal Partner Contestuale State
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Modal Capitolato State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('OPERE_EDILI');
  const [itemBudgeted, setItemBudgeted] = useState('');

  const fetchPropertyData = async (propId: string) => {
    const { data: prop } = await supabase.from('properties').select('*').eq('id', propId).single();
    if (prop) {
      setProperty(prop);
      // Carica fornitori attivi per la stessa città
      const { data: cityPartners } = await supabase.from('partners').select('*').ilike('city', prop.city || 'Milano');
      if (cityPartners) setAllPartners(cityPartners);
    }

    const { data: docs } = await supabase.from('property_documents').select('*').eq('property_id', propId).order('created_at', { ascending: false });
    if (docs) setDocuments(docs);

    const { data: items } = await supabase.from('property_budget_items').select('*').eq('property_id', propId).order('created_at', { ascending: true });
    if (items) setBudgetItems(items);

    const { data: media } = await supabase.from('property_media').select('*').eq('property_id', propId).order('created_at', { ascending: false });
    if (media) setMediaItems(media);

    const { data: propPartners } = await supabase.from('property_partners').select('*, partner:partner_id(*)').eq('property_id', propId);
    if (propPartners) setAssignedPartners(propPartners);
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

  // 2. CALCOLO AUTOMATICO ROI NETTO %
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

        {/* 2. SINTESI FINANZIARIA CON CALCOLO AUTOMATICO ROI NETTO % */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Capitale Investito</span>
            <p className="text-xl font-semibold text-slate-900 mt-1">{formatCurrency(totalCapitalInvested)}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Acquisto + Restyling</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Canone Incassato</span>
            <p className="text-xl font-semibold text-slate-900 mt-1">{formatCurrency(grossRentAnnual)}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Lordo Annuale</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Netto Bonificato</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(netRentAnnual)}</p>
            <span className="text-[10px] text-emerald-700/70 mt-1 block">Accreditato all'investitore</span>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">ROI Netto Reale %</span>
            <p className="text-2xl font-black text-white mt-1">{realRoiNetPercent}%</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Calcolato sui dati reali</span>
          </div>
        </div>

        {/* 3. SEZIONE MEDIA & GALLERIA FOTO + INGAGGI FOTOGRAFO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Galleria Media & Valorizzazione Asset</h2>
              <p className="text-xs text-slate-500">Fotografie dello stato di fatto, rendering di progetto e shoot finale</p>
            </div>

            {/* FORNITORE CONTESTUALE: FOTOGRAFO */}
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
                  <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                    {item.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. SEZIONE CANTIERE & RESTYLING + FORNITORE CONTESTUALE IMPRESA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Avanzamento Cantiere & SAL</h2>
              <p className="text-xs text-slate-500">Stato dei lavori e restyling immobiliare</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openContextualPartnerModal('IMPRESA_EDILE')}
                className="bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-slate-200 transition"
              >
                🛠️ Seleziona Impresa Edile
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Descrizione Lavoro</th>
                  <th className="pb-3 pr-4">Categoria</th>
                  <th className="pb-3 pr-4">Budget Previsto</th>
                  <th className="pb-3 text-right">Avanzamento %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {budgetItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900">{item.description}</td>
                    <td className="py-3.5 pr-4"><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">{item.category}</span></td>
                    <td className="py-3.5 pr-4">{formatCurrency(item.budgeted_amount)}</td>
                    <td className="py-3.5 text-right font-bold text-slate-900">{item.sal_percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. SEZIONE FISCALE & CONTRATTI + FORNITORE CONTESTUALE COMMERCIALISTA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Fascicolo Fiscale & Contabilità</h2>
              <p className="text-xs text-slate-500">Documentazione ufficiale e moduli tributari custoditi dal Concierge</p>
            </div>
            <button
              onClick={() => openContextualPartnerModal('COMMERCIALISTA')}
              className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
            >
              💼 Seleziona Commercialista Partner
            </button>
          </div>

          <div className="space-y-3">
            {documents.filter(d => d.category === 'FISCALE').map((doc) => (
              <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-900">📄 {doc.file_name}</span>
                <a href={doc.file_url} target="_blank" className="bg-white border border-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium">Download</a>
              </div>
            ))}
          </div>
        </div>

        {/* MODALE PARTNER CONTESTUALE FILTRATO */}
        {isPartnerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Fornitori {selectedCategoryFilter || 'Network'} su {property.city}
                  </h3>
                  <p className="text-xs text-slate-500">Partner accreditati selezionati per questa specifica esigenza</p>
                </div>
                <button type="button" onClick={() => setIsPartnerModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-sm">✕</button>
              </div>

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
                      </div>
                      <button
                        onClick={() => handleAssignPartner(p)}
                        disabled={assigningId === p.id}
                        className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition whitespace-nowrap"
                      >
                        {assigningId === p.id ? 'In corso...' : 'Associa & Invita'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}