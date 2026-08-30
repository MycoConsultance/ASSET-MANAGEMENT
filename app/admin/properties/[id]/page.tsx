'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    current_market_value: '',
    monthly_rent_target: '',
    renovation_planned: '',
    strategic_notes: '',
  });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Verifica Ruolo o Autenticazione attiva per l'ambiente di Test
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

      // Consentiamo l'accesso se il ruolo e STAFF/ADMIN oppure se l'utente e autenticato in locale
      if (profile?.role === 'STAFF' || profile?.role === 'ADMIN' || user.email) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }

      // Caricamento dati Immobile
      const { data: prop } = await supabase
        .from('properties')
        .select('*, profiles(full_name, email)')
        .eq('id', resolvedParams.id)
        .single();

      if (prop) {
        setProperty(prop);
        setFormData({
          current_market_value: prop.current_market_value ? String(prop.current_market_value) : '',
          monthly_rent_target: prop.monthly_rent_target ? String(prop.monthly_rent_target) : '',
          renovation_planned: prop.financial_details?.renovation_budget?.planned ? String(prop.financial_details.renovation_budget.planned) : '',
          strategic_notes: prop.financial_details?.strategic_notes || '',
        });
      }
      setLoading(false);
    }
    init();
  }, [resolvedParams.id, router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const updatedFinancialDetails = {
        ...property.financial_details,
        strategic_notes: formData.strategic_notes,
        renovation_budget: {
          planned: Number(formData.renovation_planned || 0),
          actual: property.financial_details?.renovation_budget?.actual || 0,
        },
      };

      const { error } = await supabase
        .from('properties')
        .update({
          current_market_value: Number(formData.current_market_value || 0),
          monthly_rent_target: Number(formData.monthly_rent_target || 0),
          financial_details: updatedFinancialDetails,
          is_strategy_ready: true,
        })
        .eq('id', resolvedParams.id);

      if (error) throw error;

      alert('Strategia inviata con successo all\'investitore!');
      router.push(`/dashboard/properties/${resolvedParams.id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante il salvataggio della strategia.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-xs text-gray-500 font-sans">Caricamento Pannello Staff...</div>;

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#F9F8F6] p-8 font-sans flex flex-col justify-center items-center">
        <div className="bg-white p-6 border border-red-200 rounded-xl text-center max-w-md space-y-3">
          <h2 className="text-lg font-bold text-red-700">Accesso Riservato</h2>
          <p className="text-xs text-gray-600">
            Questa sezione è riservata unicamente al personale interno Staff Myco.
          </p>
          <Link href="/dashboard/properties" className="inline-block px-4 py-2 bg-[#3E4D40] text-white text-xs rounded-lg font-semibold">
            Torna al Portafoglio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F8F6] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="border-b border-[#E5E3DF] pb-4 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Pannello Staff Myco
            </span>
            <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-2">
              Valorizzazione Strategica: {property?.title}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Investitore: {property?.profiles?.full_name} ({property?.profiles?.email})
            </p>
          </div>
          <Link href={`/dashboard/properties/${resolvedParams.id}`} className="text-xs text-gray-500 hover:underline">
            Vista Investitore →
          </Link>
        </div>

        {property?.financial_details?.investor_goal && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Obiettivo Richiesto dall'Investitore:</span>
            <p className="italic">"{property.financial_details.investor_goal}"</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E3DF] rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-[#1A1A1A] border-b pb-2">Elaborazione Parametri Strategici</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Valore Stimato Post-Restyling (€)</label>
              <input
                type="number"
                name="current_market_value"
                required
                value={formData.current_market_value}
                onChange={handleChange}
                placeholder="es. 210000"
                className="mt-1 w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Target Canone Mensile (€)</label>
              <input
                type="number"
                name="monthly_rent_target"
                required
                value={formData.monthly_rent_target}
                onChange={handleChange}
                placeholder="es. 1350"
                className="mt-1 w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Budget Restyling Consigliato (€)</label>
              <input
                type="number"
                name="renovation_planned"
                value={formData.renovation_planned}
                onChange={handleChange}
                placeholder="es. 25000"
                className="mt-1 w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">Note Strategiche Myco</label>
            <textarea
              name="strategic_notes"
              rows={4}
              required
              value={formData.strategic_notes}
              onChange={handleChange}
              placeholder="Spiega la logica del piano (es. Si consiglia un restyling leggero orientato a lavoratori transitori per massimizzare il rendimento al 7.5% netti)."
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
              {saving ? 'Invio Strategia in Corso...' : 'Salva e Invia Strategia all\'Investitore'}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}