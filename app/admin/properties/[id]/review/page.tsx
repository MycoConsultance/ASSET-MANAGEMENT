'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPropertyReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    investor_strategy_profile: 'CASSETTISTA_RENDITA',
    market_appreciation: '15000',
    effective_yield: '6.5',
    fiscal_optimization_notes: 'Consigliata opzione Cedolare Secca al 10% previa stipula contratto a canone concordato (3+2).',
    action_recommended: 'KEEP_RENT',
  });

  useEffect(() => {
    async function init() {
      const { data: prop } = await supabase
        .from('properties')
        .select('*, profiles(full_name, email)')
        .eq('id', resolvedParams.id)
        .single();

      if (prop) {
        setProperty(prop);
        if (prop.investor_strategy_profile) {
          setFormData((prev) => ({ ...prev, investor_strategy_profile: prop.investor_strategy_profile }));
        }
      }
      setLoading(false);
    }
    init();
  }, [resolvedParams.id, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      // 1. Aggiornamento profilo strategia su Properties
      await supabase
        .from('properties')
        .update({ investor_strategy_profile: formData.investor_strategy_profile })
        .eq('id', resolvedParams.id);

      // 2. Inserimento nuova Review Patrimoniale
      const { error: reviewErr } = await supabase.from('property_reviews').insert({
        property_id: resolvedParams.id,
        market_appreciation: Number(formData.market_appreciation || 0),
        effective_yield: Number(formData.effective_yield || 0),
        fiscal_optimization_notes: formData.fiscal_optimization_notes,
        action_recommended: formData.action_recommended,
      });

      if (reviewErr) throw reviewErr;

      alert('Review Patrimoniale Annuale pubblicata con successo!');
      router.push(`/dashboard/properties/${resolvedParams.id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante la pubblicazione della review.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-xs text-gray-500 font-sans">Caricamento Pannello Review...</div>;

  return (
    <main className="min-h-screen bg-[#F9F8F6] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="border-b border-[#E5E3DF] pb-4 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Staff Asset Care
            </span>
            <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-2">
              Emissione Review Patrimoniale: {property?.title}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Investitore: {property?.profiles?.full_name} ({property?.profiles?.email})
            </p>
          </div>
          <Link href={`/dashboard/properties/${resolvedParams.id}`} className="text-xs text-gray-500 hover:underline">
            ← Scheda Asset
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E3DF] rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-[#1A1A1A] border-b pb-2">Parametri di Valutazione Patrimoniale</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Profilo Strategia Investitore</label>
              <select
                name="investor_strategy_profile"
                value={formData.investor_strategy_profile}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-xs font-semibold bg-white focus:outline-none focus:border-[#3E4D40]"
              >
                <option value="CASSETTISTA_RENDITA">Cassettista Rendita (Cash Flow Stabile)</option>
                <option value="TRADING_CRESCITA">Trading & Crescita (Plusvalenza Breve Termine)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Azione Consigliata da Myco</label>
              <select
                name="action_recommended"
                value={formData.action_recommended}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-xs font-semibold bg-white focus:outline-none focus:border-[#3E4D40]"
              >
                <option value="KEEP_RENT">Mantenere a Rendita (Locazione a Regime)</option>
                <option value="REFRACTOR_SURROGA">Rifinanziare / Surroga Mutuo</option>
                <option value="SELL_EXIT">Vendita / Exit Strategica per Plusvalenza</option>
                <option value="UPGRADE_RESTYLING">Upgrade / Nuovo Restyling Effettuale</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Stima Rivalutazione Immobile (€)</label>
              <input
                type="number"
                name="market_appreciation"
                required
                value={formData.market_appreciation}
                onChange={handleChange}
                placeholder="es. 15000"
                className="mt-1 w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Rendimento Effettivo Calcolato (%)</label>
              <input
                type="number"
                step="0.1"
                name="effective_yield"
                required
                value={formData.effective_yield}
                onChange={handleChange}
                placeholder="es. 6.5"
                className="mt-1 w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">Note di Ottimizzazione Fiscale & Legale</label>
            <textarea
              name="fiscal_optimization_notes"
              rows={3}
              required
              value={formData.fiscal_optimization_notes}
              onChange={handleChange}
              placeholder="Fornisci raccomandazioni su cedolare secca, detrazioni edilizie o gestione spese condominiali."
              className="mt-1 w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E5E3DF]">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#3E4D40] text-white rounded-lg text-xs font-semibold hover:bg-[#2F3B31] transition shadow-sm"
            >
              {saving ? 'Pubblicazione in corso...' : 'Pubblica Review Patrimoniale'}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}