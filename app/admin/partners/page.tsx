'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminPartnersPage() {
  const supabase = createClient();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State Nuovo Partner
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('IMPRESA_EDILE');
  const [city, setCity] = useState('Milano');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState('5.0');
  const [description, setDescription] = useState('');
  const [isRecommended, setIsRecommended] = useState(true);

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (data) setPartners(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, [supabase]);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('partners').insert({
      company_name: companyName,
      category,
      city,
      contact_email: email,
      rating: parseFloat(rating),
      description,
      is_myco_recommended: isRecommended,
      is_approved: true, // Inserito direttamente dallo Staff = Approvato
    });

    setCompanyName('');
    setEmail('');
    setDescription('');
    await fetchPartners();
  };

  const handleApproveChanges = async (partnerId: string, pendingBio: string, pendingPortfolio: any) => {
    await supabase.from('partners').update({
      bio_full: pendingBio || undefined,
      portfolio_urls: pendingPortfolio || undefined,
      pending_bio: null,
      pending_portfolio: null,
      is_approved: true
    }).eq('id', partnerId);

    await fetchPartners();
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <Link href="/dashboard/properties" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
              ← Torna al Portafoglio
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Pannello Staff — Governance Network Fornitori</h1>
            <p className="text-xs text-slate-500">Accreditamento chiuso Curated Network & Controllo Qualità</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* FORM ACCREDITAMENTO CHIUSO (NO PUBLIC SIGNUP) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Accredita Nuovo Fornitore</h2>
            <form onSubmit={handleCreatePartner} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Ragione Sociale</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="es. Studio Notarile Rossi" className="w-full h-9 px-3 border border-slate-200 rounded-lg" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-9 px-3 border border-slate-200 rounded-lg">
                  <option value="IMPRESA_EDILE">Impresa Edile</option>
                  <option value="COMMERCIALISTA">Commercialista</option>
                  <option value="PROPERTY_MANAGER">Property Manager</option>
                  <option value="FOTOGRAFO">Fotografo / Home Stager</option>
                  <option value="NOTAIO">Notaio</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Città</label>
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="w-full h-9 px-3 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Rating Initial</label>
                  <input type="number" step="0.1" value={rating} onChange={e => setRating(e.target.value)} className="w-full h-9 px-3 border border-slate-200 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Email Contatto</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full h-9 px-3 border border-slate-200 rounded-lg" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Sintesi Presentazione</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg h-20" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={isRecommended} onChange={e => setIsRecommended(e.target.checked)} className="rounded text-slate-900" />
                <span className="font-semibold text-slate-700">Assegna Badge "★ Consigliato da Myco"</span>
              </label>

              <button type="submit" className="w-full h-10 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition">
                Accredita & Inserisci in Network
              </button>
            </form>
          </div>

          {/* ELENCO FORNITORI & CONTROL QUALITY REVISIONI */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fornitori Accreditati in Anagrafica</h2>
            
            {loading ? (
              <p className="text-xs text-slate-400 italic">Caricamento fornitori...</p>
            ) : (
              <div className="space-y-3">
                {partners.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        {p.is_myco_recommended && (
                          <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase mr-2">
                            Myco Choice
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{p.category} • {p.city}</span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{p.company_name}</h3>
                        <p className="text-xs text-slate-500">{p.contact_email}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">★ {p.rating}</span>
                    </div>

                    {/* SEZIONE APPROVAL FLOW MODIFICHE SCHEDA */}
                    {p.pending_bio && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                        <span className="font-bold text-amber-900 block">⚠️ Modifica Scheda in Attesa di Controllo Qualità Staff</span>
                        <p className="text-slate-700 italic">"{p.pending_bio}"</p>
                        <button
                          onClick={() => handleApproveChanges(p.id, p.pending_bio, p.pending_portfolio)}
                          className="bg-amber-500 text-slate-950 font-bold text-[10px] px-3 py-1 rounded-lg hover:bg-amber-400"
                        >
                          Approva & Pubblica su Modali Investitore
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}