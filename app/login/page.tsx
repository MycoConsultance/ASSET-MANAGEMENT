'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'INVESTOR',
            },
          },
        });
        if (error) throw error;
        alert('Account creato con successo! Accedi direttamente o verifica la mail se attiva su Supabase.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard/properties');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Si e verificato un errore durante l autenticazione.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9F8F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#6C7C6E]">
          Myco Asset Management
        </span>
        <h2 className="text-3xl font-semibold text-[#1A1A1A]">
          {isSignUp ? 'Crea il tuo Account Investitore' : 'Accedi al Portale Patrimoniale'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-[#E5E3DF] rounded-xl sm:px-10">
          <form className="space-y-5" onSubmit={handleAuth}>
            
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nome e Cognome
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
                    placeholder="Mario Rossi"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                Indirizzo Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
                  placeholder="investitore@esempio.it"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm focus:outline-none focus:border-[#3E4D40]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-[#3E4D40] hover:bg-[#2F3B31] transition focus:outline-none"
              >
                {loading ? 'Elaborazione...' : isSignUp ? 'Registrati come Investitore' : 'Accedi alla Dashboard'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-xs font-medium text-[#6C7C6E] hover:text-[#3E4D40] transition"
            >
              {isSignUp
                ? 'Hai gia un account? Accedi qui'
                : 'Non hai ancora un account? Registrati'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}