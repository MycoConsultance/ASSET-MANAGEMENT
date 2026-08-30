'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setCurrentUserRole(profile.role);
      }
      await fetchProfiles();
      setLoading(false);
    }
    init();
  }, [supabase]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      await fetchProfiles();
    } else {
      alert('Errore aggiornamento ruolo: ' + error.message);
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center text-xs text-slate-400 font-sans tracking-widest uppercase">
        Caricamento Pannello Amministrazione...
      </div>
    );
  }

  if (currentUserRole !== 'ADMIN' && currentUserRole !== 'STAFF') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <span className="text-4xl">🚫</span>
          <h1 className="text-lg font-bold text-slate-900">Accesso Riservato Admin</h1>
          <p className="text-xs text-slate-500">Non disponi dei permessi necessari per accedere alla gestione utenze.</p>
          <Link href="/dashboard/properties" className="inline-block px-4 py-2 bg-slate-900 text-white text-xs rounded-xl font-medium">
            ← Torna al Portafoglio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-8 font-sans antialiased">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER ADMIN */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/dashboard/properties" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition">
              ← Torna al Portafoglio
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">Gestione Utenze & Ruoli</h1>
            <p className="text-xs text-slate-500 font-light mt-0.5">Assegna e modifica i permessi di accesso della piattaforma Myco</p>
          </div>
          <span className="px-3 py-1 bg-slate-200 text-slate-800 text-xs font-semibold rounded-full uppercase">
            Ruolo Attivo: {currentUserRole}
          </span>
        </div>

        {/* TABELLA UTENTI */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Utenti Registrati ({users.length})</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{u.email || u.id}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {u.id}</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Ruolo:</span>
                  <select
                    value={u.role || 'INVESTOR'}
                    disabled={updatingId === u.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="h-10 px-3.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-900 w-full sm:w-auto"
                  >
                    <option value="INVESTOR">INVESTITORE (Lettura Portafoglio)</option>
                    <option value="STAFF">STAFF MYCO (Operativo Assets)</option>
                    <option value="ADMIN">ADMINISTRATOR (Accesso Totale)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}