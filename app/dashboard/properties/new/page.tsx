'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function NewPropertyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    city: '',
    purchase_price: '',
    investor_goal: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // Iniezione sicura auth.uid() lato client/server
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato.');

      const { data, error } = await supabase.from('properties').insert({
        user_id: user.id, // Iniezione ID utente verificato
        title: formData.title,
        address: formData.address,
        city: formData.city,
        purchase_price: Number(formData.purchase_price || 0),
        current_phase: 'IN_ANALISI',
        is_strategy_ready: false,
        financial_details: {
          investor_goal: formData.investor_goal,
        },
      }).select().single();

      if (error) throw error;

      router.push(`/dashboard/properties/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9F8F6] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="border-b border-[#E5E3DF] pb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#6C7C6E]">
            Myco Concierge
          </span>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-1">Onboarding Nuovo Asset</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E3DF] rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">Titolo / Identificativo</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="es. Via Marche 26"
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Indirizzo</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="es. Via Marche 26"
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase">Città</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="es. Milano"
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">Prezzo d'Acquisto / Trattativa (€)</label>
            <input
              type="number"
              name="purchase_price"
              required
              value={formData.purchase_price}
              onChange={handleChange}
              placeholder="es. 150000"
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">Obiettivo dell'Investitore</label>
            <textarea
              name="investor_goal"
              rows={3}
              value={formData.investor_goal}
              onChange={handleChange}
              placeholder="es. Messa a reddito per rendimento netto > 6%"
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#3E4D40] text-white text-xs font-semibold rounded-lg hover:bg-[#2F3B31]"
          >
            {loading ? 'Salvataggio...' : 'Registra Immobile'}
          </button>
        </form>
      </div>
    </main>
  );
}