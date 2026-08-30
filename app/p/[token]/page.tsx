import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface PartnerLandingProps {
  params: Promise<{ token: string }>;
}

export default async function PartnerLandingPage({ params }: PartnerLandingProps) {
  const { token } = await params;
  const supabase = await createClient();

  // 1. Valida il token dal database
  const { data: accessData, error } = await supabase
    .from('partner_access_tokens')
    .select(`
      *,
      properties (
        title,
        address,
        city,
        profiles (
          full_name
        )
      )
    `)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  // Se il token è fasullo o scaduto, mostra 404
  if (error || !accessData) {
    notFound();
  }

  const property = accessData.properties as unknown as {
    title: string;
    address: string;
    city: string;
    profiles: { full_name: string };
  };

  return (
    <main className="min-h-screen bg-[#F9F8F6] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Istituzionale Myco */}
        <div className="border-b border-[#E5E3DF] pb-6 flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#6C7C6E]">
              Spazio Lavoro Esterno • Myco Ecosystem
            </span>
            <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-1">
              Pratica: {property?.address}, {property?.city}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Cliente Investitore: <strong>{property?.profiles?.full_name}</strong>
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#3E4D40] text-white">
            {accessData.partner_role}
          </span>
        </div>

        {/* Box 1: Download Cartella Digitale */}
        <section className="bg-white border border-[#E5E3DF] rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-medium text-[#1A1A1A]">1. Fascicolo Immobiliare Predisposto</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Tutti i documenti verified da Myco per la stipula della pratica.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={`/api/partner/download-archive?token=${token}`}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-[#3E4D40] hover:bg-[#2F3B31] rounded-lg transition-colors"
            >
              Scarica Cartella Digitale (.ZIP)
            </a>
          </div>
        </section>

        {/* Box 2: Dropzone Upload Bozza */}
        <section className="bg-white border-2 border-dashed border-[#E5E3DF] rounded-xl p-8 text-center space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-[#1A1A1A]">2. Carica Bozza o Documenti Elaborati</h2>
            <p className="text-xs text-gray-500">
              I file caricati verranno notificati all'investitore e archiviati nel fascicolo dell'immobile.
            </p>
          </div>
          
          <div className="pt-2">
            <input type="file" className="hidden" id="partner-file-upload" />
            <label
              htmlFor="partner-file-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-[#E5E3DF] text-xs font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              Seleziona File dal Computer
            </label>
          </div>
        </section>

        {/* Hook B2B Lead Generation */}
        <div className="bg-[#EFECE6] border border-[#E5E3DF] rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Gestisci pratiche immobiliari in modo ricorrente?</h3>
            <p className="text-xs text-gray-600 mt-1 max-w-lg">
              Azzera i tempi spesi a reperire visure e documenti dagli acquirenti. Scopri come il network Myco automatizza la preparazione delle pratiche.
            </p>
          </div>
          <button className="whitespace-nowrap text-xs font-medium bg-[#3E4D40] text-white px-4 py-2 rounded-lg hover:bg-[#2F3B31] transition">
            Richiedi Accesso Partner
          </button>
        </div>

      </div>
    </main>
  );
}
