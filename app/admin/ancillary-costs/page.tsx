'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminAncillaryEditorPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  const [notaryFees, setNotaryFees] = useState(0);
  const [agencyFees, setAgencyFees] = useState(0);
  const [transferTaxes, setTransferTaxes] = useState(0);
  const [mortgageSetupCosts, setMortgageSetupCosts] = useState(0);
  const [initialReserveFund, setInitialReserveFund] = useState(0);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProps() {
      const { data } = await supabase.from('properties').select('*');
      if (data && data.length > 0) {
        setProperties(data);
        selectProp(data[0]);
      }
    }
    fetchProps();
  }, [supabase]);

  const selectProp = (prop: any) => {
    setSelectedProperty(prop);
    setNotaryFees(Number(prop.notary_fees || 0));
    setAgencyFees(Number(prop.agency_fees || 0));
    setTransferTaxes(Number(prop.transfer_taxes || 0));
    setMortgageSetupCosts(Number(prop.mortgage_setup_costs || 0));
    setInitialReserveFund(Number(prop.initial_reserve_fund || 0));
  };

  const handleSaveCosts = async () => {
    if (!selectedProperty) return;
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from('properties')
      .update({
        notary_fees: notaryFees,
        agency_fees: agencyFees,
        transfer_taxes: transferTaxes,
        mortgage_setup_costs: mortgageSetupCosts,
        initial_reserve_fund: initialReserveFund,
      })
      .eq('id', selectedProperty.id);

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestione Spese Accessorie Asset</h1>
          <p className="text-xs text-slate-500">Pannello riservato allo Staff Myco per l'aggiornamento del Financial Shield</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Seleziona Immobile</label>
            <select
              value={selectedProperty?.id || ''}
              onChange={(e) => {
                const found = properties.find((p) => p.id === e.target.value);
                if (found) selectProp(found);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title} ({p.city})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Spettanze Notarili (€)</label>
              <input
                type="number"
                value={notaryFees}
                onChange={(e) => setNotaryFees(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Provvigione Agenzia (€)</label>
              <input
                type="number"
                value={agencyFees}
                onChange={(e) => setAgencyFees(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Imposte & Tasse Trasferimento (€)</label>
              <input
                type="number"
                value={transferTaxes}
                onChange={(e) => setTransferTaxes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Istruttoria Mutuo & Perizie (€)</label>
              <input
                type="number"
                value={mortgageSetupCosts}
                onChange={(e) => setMortgageSetupCosts(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1 col-span-1 sm:col-span-2">
              <label className="text-xs font-semibold text-emerald-700">Fondo Cassa Operativo Iniziale (€)</label>
              <input
                type="number"
                value={initialReserveFund}
                onChange={(e) => setInitialReserveFund(Number(e.target.value))}
                className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            {success && <span className="text-xs font-bold text-emerald-600">✓ Modifiche salvate con successo!</span>}
            {!success && <span />}

            <button
              onClick={handleSaveCosts}
              disabled={saving}
              className="bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              {saving ? 'Salvataggio...' : 'Salva Spese Accessorie'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}