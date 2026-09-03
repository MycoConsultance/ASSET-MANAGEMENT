'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [profileId, setProfileId] = useState<string | null>(null);
  const [familyOfficeName, setFamilyOfficeName] = useState('');
  const [hasCustomBranding, setHasCustomBranding] = useState(false);
  const [notifications, setNotifications] = useState({
    documents: true,
    construction_updates: true,
    vacancy_alerts: true,
    monthly_reports: true,
  });

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfileId(user.id);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setFamilyOfficeName(profile.family_office_name || '');
          setHasCustomBranding(!!profile.has_custom_branding);
          if (profile.notification_preferences) {
            setNotifications(profile.notification_preferences);
          }
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    setSaving(true);
    setSuccessMsg('');

    const { error } = await supabase
      .from('profiles')
      .update({
        family_office_name: familyOfficeName,
        has_custom_branding: hasCustomBranding,
        notification_preferences: notifications,
      })
      .eq('id', profileId);

    if (!error) {
      setSuccessMsg('Impostazioni aggiornate con successo!');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">Caricamento impostazioni...</div>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <Link href="/dashboard/properties" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition">
              ← Torna al Portafoglio
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Centro Impostazioni & Controllo</h1>
            <p className="text-xs text-slate-500">Gestisci le notifiche, la personalizzazione e il branding del tuo account</p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* PREFERENZE NOTIFICHE EMAIL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Preferenze Notifiche Email</h2>
            <div className="space-y-3 text-xs text-slate-700">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <span>Caricamento Nuovi Documenti nel Fascicolo</span>
                <input type="checkbox" checked={notifications.documents} onChange={e => setNotifications({...notifications, documents: e.target.checked})} className="w-4 h-4 rounded text-slate-900" />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <span>Aggiornamenti Stato Cantiere & SAL</span>
                <input type="checkbox" checked={notifications.construction_updates} onChange={e => setNotifications({...notifications, construction_updates: e.target.checked})} className="w-4 h-4 rounded text-slate-900" />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <span>Alert Anti-Sfitto Locazioni (-60 Giorni)</span>
                <input type="checkbox" checked={notifications.vacancy_alerts} onChange={e => setNotifications({...notifications, vacancy_alerts: e.target.checked})} className="w-4 h-4 rounded text-slate-900" />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <span>Report Mensili & Rendiconto Rendite</span>
                <input type="checkbox" checked={notifications.monthly_reports} onChange={e => setNotifications({...notifications, monthly_reports: e.target.checked})} className="w-4 h-4 rounded text-slate-900" />
              </label>
            </div>
          </div>

          {/* WHITE-LABEL BRANDING SUPPLEMENT */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">White-Label Custom Report Supplement</h2>
                <p className="text-xs text-slate-500">Integrazione intestazione dedicata per Holding e Family Office</p>
              </div>
              <input type="checkbox" checked={hasCustomBranding} onChange={e => setHasCustomBranding(e.target.checked)} className="w-4 h-4 rounded text-slate-900" />
            </div>

            {hasCustomBranding && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nome Holding / Family Office</label>
                  <input
                    type="text"
                    value={familyOfficeName}
                    onChange={e => setFamilyOfficeName(e.target.value)}
                    placeholder="es. Visconti Private Investments SA"
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition shadow-sm"
          >
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </button>

        </form>

      </div>
    </main>
  );
}