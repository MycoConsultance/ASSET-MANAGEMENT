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
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Update State
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    async function init() {
      if (!token) {
        setLoading(false);
        return;
      }

      const { data: assoc } = await supabase
        .from('property_partners')
        .select('*, partner:partner_id(*)')
        .eq('property_id', resolvedParams.id)
        .eq('access_token', token)
        .single();

      if (assoc) {
        setPartnerAssoc(assoc);
        if (assoc.partner) setEditBio(assoc.partner.bio_full || assoc.partner.description || '');

        const { data: prop } = await supabase.from('properties').select('*').eq('id', resolvedParams.id).single();
        if (prop) setProperty(prop);

        const { data: qData } = await supabase.from('property_quotes').select('*').eq('property_id', resolvedParams.id);
        if (qData) setQuotes(qData);
      }
      setLoading(false);
    }
    init();
  }, [resolvedParams.id, token, supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerAssoc?.partner_id) return;
    setSavingProfile(true);
    setProfileMsg('');

    // Invio modifiche in stato di revisione per lo Staff Myco
    await supabase.from('partners').update({
      pending_bio: editBio,
      is_approved: false
    }).eq('id', partnerAssoc.partner_id);

    setProfileMsg('Modifiche inviate allo Staff Myco per il Controllo Qualità prima della pubblicazione.');
    setSavingProfile(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">Verifica Magic Link...</div>;
  if (!partnerAssoc || !property) return <div className="min-h-screen bg-slate-50 p-8 text-xs text-red-500 font-sans">Accesso non autorizzato.</div>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER AREA RISERVATA FORNITORE */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
          <div>
            <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
              Area Riservata Partner
            </span>
            <h1 className="text-2xl font-bold mt-1">{property.title}</h1>
            <p className="text-xs text-slate-400">{property.address}, {property.city}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase">Fornitore Incaricato</span>
            <p className="text-sm font-bold">{partnerAssoc.partner?.company_name}</p>
          </div>
        </div>

        {/* 2. PREVENTIVI BLOCCATI & LOCK-IN PREZZI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Stato Preventivi Incarico</h2>
            <p className="text-xs text-slate-500">I preventivi approvati dall'investitore sono bloccati in sola lettura</p>
          </div>

          <div className="space-y-3">
            {quotes.map((q) => (
              <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{q.title}</h4>
                  <span className="text-[10px] text-slate-400">Importo: {formatCurrency(q.amount)}</span>
                </div>
                <div>
                  {q.status === 'APPROVED_LOCKED' ? (
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-3 py-1 rounded-full border border-emerald-200">
                      🔒 PREVENTIVO BLOCCATO & APPROVATO
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-3 py-1 rounded-full">
                      In Attesa Approvazione
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. COMPILAZIONE SCHEDA CON CONTROL QUALITY STAFF */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Aggiorna Profilo & Presentazione Studio</h2>
            <p className="text-xs text-slate-500">Le modifiche saranno verificate dallo Staff Myco prima di comparire all'investitore</p>
          </div>

          {profileMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl font-medium">
              ✓ {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Presentazione & Servizi</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs h-28"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              {savingProfile ? 'Invio in corso...' : 'Invia Modifica per Controllo Qualità'}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}