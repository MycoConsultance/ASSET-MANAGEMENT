'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/formatters';

export default function SharedPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = createClient();

  const [property, setProperty] = useState<any>(null);
  const [partnerAssoc, setPartnerAssoc] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State Inserimento Dati per Property Manager
  const [grossIncome, setGrossIncome] = useState('');
  const [operatingExpenses, setOperatingExpenses] = useState('');
  const [savingIncome, setSavingIncome] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function init() {
      if (!token) {
        setLoading(false);
        return;
      }

      // 1. Verifica il token di accesso nella tabella property_partners
      const { data: assoc } = await supabase
        .from('property_partners')
        .select('*, partner:partner_id(*)')
        .eq('property_id', resolvedParams.id)
        .eq('access_token', token)
        .single();

      if (assoc) {
        setPartnerAssoc(assoc);

        // 2. Carica l'immobile
        const { data: prop } = await supabase.from('properties').select('*').eq('id', resolvedParams.id).single();
        if (prop) {
          setProperty(prop);
          setGrossIncome(prop.monthly_rent ? String(prop.monthly_rent) : '');
          setOperatingExpenses(prop.management_fees ? String(prop.management_fees) : '');
        }

        // 3. Carica i documenti
        const { data: docs } = await supabase.from('property_documents').select('*').eq('property_id', resolvedParams.id);
        if (docs) setDocuments(docs);
      }
      setLoading(false);
    }
    init();
  }, [resolvedParams.id, token, supabase]);

  const handleUpdateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSavingIncome(true);
    setSuccessMsg('');

    const rentMonthly = parseFloat(grossIncome) || 0;
    const feesMonthly = parseFloat(operatingExpenses) || 0;

    const { error } = await supabase
      .from('properties')
      .update({
        monthly_rent: rentMonthly,
        management_fees: feesMonthly,
      })
      .eq('id', property.id);

    if (!error) {
      setSuccessMsg('Consuntivo mensile aggiornato con successo! I KPI dell\'investitore sono stati ricalcolati.');
      setProperty({ ...property, monthly_rent: rentMonthly, management_fees: feesMonthly });
    }
    setSavingIncome(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">Verifica Magic Link in corso...</div>;
  if (!partnerAssoc || !property) return <div className="min-h-screen bg-slate-50 p-8 text-xs text-red-500 font-sans">Accesso non autorizzato o Token scaduto.</div>;

  const partnerRole = partnerAssoc.partner_role || 'PARTNER';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER AREA RISERVATA */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                Vista Riservata Partner
              </span>
              <span className="text-xs text-slate-400">Ruolo: {partnerRole}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">{property.title}</h1>
            <p className="text-xs text-slate-400">{property.address}, {property.city}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase">Fornitore Incaricato</span>
            <p className="text-sm font-bold">{partnerAssoc.partner?.company_name || partnerAssoc.partner_email}</p>
          </div>
        </div>

        {/* 1. SEZIONE DEDICATA AL COMMERCIALISTA */}
        {partnerRole === 'COMMERCIALISTA' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Area Fiscale & Rendicontazione</h2>
              <p className="text-xs text-slate-500">Accesso riservato per adempimenti fiscali, mod. F24 e contratti di locazione</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Canone Annuo Lordo Maturato</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency((property.monthly_rent || 0) * 12)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Rif. Catastali & Regime</span>
                <p className="text-xs font-semibold text-slate-900 mt-1">Foglio: 12 • Part: 450 • Sub: 12 (Cedolare Secca 21%)</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase">Documentazione Fiscale & Atti dell'Asset</h3>
              {documents.filter(d => d.category === 'FISCALE' || d.category === 'LEGALE').map(doc => (
                <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-900">📄 {doc.file_name}</span>
                  <a href={doc.file_url} target="_blank" className="bg-white border border-slate-200 px-3 py-1 rounded-lg font-medium">Scarica</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. SEZIONE DEDICATA AL PROPERTY MANAGER */}
        {partnerRole === 'PROPERTY_MANAGER' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Aggiornamento Consuntivo Mensile Rendita</h2>
              <p className="text-xs text-slate-500">Inserisci i dati effettivi di incasso e spese per il ricalcolo automatico del ROI dell'investitore</p>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleUpdateIncome} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Canone Incassato Mensile (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={grossIncome}
                    onChange={(e) => setGrossIncome(e.target.value)}
                    placeholder="1500.00"
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Spese Operative & Fees Mensili (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={operatingExpenses}
                    onChange={(e) => setOperatingExpenses(e.target.value)}
                    placeholder="225.00"
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-red-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingIncome}
                className="bg-slate-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition"
              >
                {savingIncome ? 'Aggiornamento...' : 'Salva Consuntivo Mensile'}
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}