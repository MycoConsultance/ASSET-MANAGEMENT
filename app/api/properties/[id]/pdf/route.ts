import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = createClient();

  // Fetch dati completi
  const { data: property } = await supabase
    .from('properties')
    .select('*, profiles(full_name, email)')
    .eq('id', resolvedParams.id)
    .single();

  const { data: reviews } = await supabase
    .from('property_reviews')
    .select('*')
    .eq('property_id', resolvedParams.id)
    .order('created_at', { ascending: false });

  const { data: docs } = await supabase
    .from('property_documents')
    .select('*')
    .eq('property_id', resolvedParams.id);

  if (!property) return new Response('Asset non trovato', { status: 404 });

  const latestReview = reviews && reviews.length > 0 ? reviews[0] : null;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>Report Asset Care - ${property.title}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1A1A; margin: 0; padding: 40px; background: #FFF; }
        .header { border-b: 2px solid #3E4D40; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 20px; font-weight: bold; color: #3E4D40; text-transform: uppercase; letter-spacing: 2px; }
        .subtitle { font-size: 11px; color: #6C7C6E; text-transform: uppercase; }
        .title { font-size: 28px; font-weight: bold; margin-top: 5px; }
        .badge { background: #F3F2EE; border: 1px solid #E5E3DF; padding: 4px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
        .card { border: 1px solid #E5E3DF; padding: 15px; border-radius: 8px; background: #F9F8F6; }
        .card-label { font-size: 10px; text-transform: uppercase; color: #6C7C6E; font-weight: bold; }
        .card-val { font-size: 20px; font-weight: bold; color: #1A1A1A; margin-top: 5px; }
        .section { border-top: 1px solid #E5E3DF; padding-top: 20px; margin-top: 30px; }
        .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #3E4D40; margin-bottom: 15px; }
        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E3DF; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Myco Concierge</div>
          <div class="subtitle">Private Real Estate Asset Management Report</div>
        </div>
        <div class="badge">Fase: ${property.current_phase}</div>
      </div>

      <div>
        <div class="subtitle">Asset Immobiliare</div>
        <div class="title">${property.title}</div>
        <p style="font-size: 13px; color: #4B5563; margin-top: 2px;">${property.address}, ${property.city} • Proprietà: ${property.profiles?.full_name || 'Investitore Myco'}</p>
      </div>

      <div style="height: 25px;"></div>

      <div class="grid">
        <div class="card">
          <div class="card-label">Prezzo d'Acquisto</div>
          <div class="card-val">€ ${Number(property.purchase_price || 0).toLocaleString('it-IT')}</div>
        </div>
        <div class="card">
          <div class="card-label">Valore Post-Restyling</div>
          <div class="card-val">€ ${Number(property.current_market_value || 0).toLocaleString('it-IT')}</div>
        </div>
        <div class="card">
          <div class="card-label">Target Canone Mensile</div>
          <div class="card-val" style="color: #3E4D40;">€ ${Number(property.monthly_rent_target || 0).toLocaleString('it-IT')}/mo</div>
        </div>
      </div>

      ${latestReview ? `
        <div class="section">
          <div class="section-title">Sintesi Review Patrimoniale & Asset Care Myco</div>
          <div class="card" style="background: #3E4D40; color: white;">
            <div style="font-size: 11px; text-transform: uppercase; color: #A7F3D0; font-weight: bold;">Azione Consigliata: ${latestReview.action_recommended}</div>
            <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">Rendimento Effettivo: ${latestReview.effective_yield}% / anno</div>
            <p style="font-size: 12px; margin-top: 10px; color: #E2E6E3;">${latestReview.fiscal_optimization_notes}</p>
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Fascicolo Digitale & Documenti Verificati (${docs ? docs.length : 0})</div>
        <ul style="font-size: 12px; line-height: 1.8; color: #374151;">
          ${docs && docs.length > 0 ? docs.map(d => `<li>📄 <strong>${d.file_name}</strong> (Caricato da: ${d.uploaded_by_role})</li>`).join('') : '<li>Nessun documento nel fascicolo.</li>'}
        </ul>
      </div>

      <div class="footer">
        Documento generato ad uso riservato dal sistema Myco Concierge Asset Management.
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}