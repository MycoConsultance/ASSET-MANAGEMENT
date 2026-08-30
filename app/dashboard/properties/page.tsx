'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatCurrency, formatPhase } from '@/lib/formatters';

export default function PropertiesDashboardPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      if (data) setProperties(data);
      setLoading(false);
    }
    fetchProperties();
  }, [supabase]);

  // Calcolo KPI Aggregati Portafoglio
  const totalAssets = properties.length;
  const totalCapitalDeployed = properties.reduce((acc, p) => acc + (Number(p.purchase_price) || 0), 0);
  const totalTargetRent = properties.reduce((acc, p) => acc + (Number(p.monthly_rent_target) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center font-sans text-slate-400 text-sm tracking-wider uppercase">
        Caricamento Portafoglio Asset...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-8 antialiased">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER DASHBOARD */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Myco Asset Management</span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">Portafoglio Immobiliare</h1>
          </div>
          <Link
            href="/dashboard/properties/new"
            className="h-11 px-5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span>+ Aggiungi Nuovo Asset</span>
          </Link>
        </div>

        {/* 1. HEADER KPI TOTALI (3 MACRO CARD) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Totale Asset</span>
            <p className="text-3xl font-semibold text-slate-900 mt-2">{totalAssets}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Capitale Deployato Totale</span>
            <p className="text-3xl font-semibold text-slate-900 mt-2">{formatCurrency(totalCapitalDeployed)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target Canone Mensile</span>
            <p className="text-3xl font-semibold text-emerald-600 mt-2">{formatCurrency(totalTargetRent)} <span className="text-xs text-slate-400 font-normal">/mo</span></p>
          </div>
        </div>

        {/* 2. GRID CARD IMMOBILI */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">I Miei Immobili</h2>

          {properties.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <p className="text-slate-500 text-sm">Nessun immobile gestito al momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop) => (
                <Link
                  key={prop.id}
                  href={`/dashboard/properties/${prop.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between space-y-6 cursor-pointer group"
                >
                  {/* Header Card */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-800">{prop.title}</h3>
                      <p className="text-xs text-slate-500 font-light mt-0.5">{prop.address}, {prop.city}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full whitespace-nowrap">
                      {formatPhase(prop.current_phase)}
                    </span>
                  </div>

                  {/* Body Card */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Valore Stimato</span>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrency(prop.current_market_value || prop.purchase_price)}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target Rent</span>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrency(prop.monthly_rent_target)}/mo</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}