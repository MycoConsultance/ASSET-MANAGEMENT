'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminPartnersPage() {
  const supabase = createClient();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('PROPERTY_MANAGER');
  const [city, setCity] = useState('Milano');
  const [rating, setRating] = useState('5.0');
  const [isRecommended, setIsRecommended] = useState(true);
  const [badgeLabel, setBadgeLabel] = useState('Consigliato da Myco');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [services, setServices] = useState({
    pratiche_atti: false,
    gestione_locazione: true,
    manutenzione_ordinaria: true,
    cantiere_restyling: false,
  });

  const fetchPartners = async () => {
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Errore caricamento partners:', error);
      setErrorMsg(error.message);
    } else if (data) {
      setPartners(data);
      setErrorMsg('');
    }
  };

  useEffect(() => {
    async function init() {
      await fetchPartners();
      setLoading(false);
    }
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactEmail) return;
    setSaving(true);
    setErrorMsg('');

    const { error } = await supabase.from('partners').insert({
      company_name: companyName,
      category,
      city,
      rating: parseFloat(rating) || 5.0,
      is_myco_recommended: isRecommended,
      badge_label: badgeLabel,
      description,
      contact_email: contactEmail,
      services_offered: services,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setCompanyName('');
      setDescription('');
      setContactEmail('');
      await fetchPartners();
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <Link href="/dashboard/properties" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition">
              ← Torna alla Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Accreditamento Partner Network</h1>
            <p className="text-xs text-slate-500">Gestisci i fornitori accreditati da mostrare agli investitori</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            ⚠️ Messaggio di errore Supabase: {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORM INSERIMENTO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Nuovo Partner Accreditato</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Nome Studio / Azienda</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="es. Studio Notarile Rossi" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Categoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-10 px-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="NOTAIO">Notaio</option>
                    <option value="PROPERTY_MANAGER">Property Manager</option>
                    <option value="IMPRESA_EDILE">Impresa Edile</option>
                    <option value="ARCHITETTO">Architetto/Tecnico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Città Operativa</label>
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="es. Milano" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Rating (1.0 - 5.0)</label>
                  <input type="number" step="0.1" max="5" min="1" value={rating} onChange={e => setRating(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Email Contatto</label>
                  <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@fornitore.com" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Consigliato da Myco</span>
                <input type="checkbox" checked={isRecommended} onChange={e => setIsRecommended(e.target.checked)} className="w-4 h-4 rounded text-slate-900" />
              </div>

              {isRecommended && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Testo Badge</label>
                  <input type="text" value={badgeLabel} onChange={e => setBadgeLabel(e.target.value)} placeholder="Consigliato da Myco" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs" />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Presentazione</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Breve descrizione delle competenze..." className="w-full p-3 border border-slate-200 rounded-xl text-xs" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Servizi Erogati</label>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={services.pratiche_atti} onChange={e => setServices({...services, pratiche_atti: e.target.checked})} />
                    Pratiche & Atti Notarili
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={services.gestione_locazione} onChange={e => setServices({...services, gestione_locazione: e.target.checked})} />
                    Gestione Locazione Transitoria
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={services.manutenzione_ordinaria} onChange={e => setServices({...services, manutenzione_ordinaria: e.target.checked})} />
                    Manutenzione Ordinaria & Pronto Intervento
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={services.cantiere_restyling} onChange={e => setServices({...services, cantiere_restyling: e.target.checked})} />
                    Cantiere & Restyling
                  </label>
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full h-10 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition">
                {saving ? 'Salvataggio...' : 'Accredita Partner'}
              </button>
            </form>
          </div>

          {/* ELENCO PARTNER */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Network Fornitori Attivi ({partners.length})</h2>

            {loading ? (
              <p className="text-xs text-slate-400 italic">Caricamento fornitori...</p>
            ) : (
              <div className="space-y-3">
                {partners.map((p) => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative space-y-2">
                    {p.is_myco_recommended && (
                      <span className="inline-block bg-amber-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ★ {p.badge_label || 'Consigliato da Myco'}
                      </span>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{p.company_name}</h3>
                        <p className="text-xs text-slate-500">{p.category} • {p.city}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        ★ {p.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                    <div className="text-[11px] text-slate-400 font-mono">Contatto: {p.contact_email}</div>
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