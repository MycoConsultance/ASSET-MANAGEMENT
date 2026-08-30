import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase.from('properties').select('*').eq('id', id).single();
  const { data: budgetItems } = await supabase.from('property_budget_items').select('*').eq('property_id', id);

  if (!property) {
    return new NextResponse('Asset non trovato', { status: 404 });
  }

  const grossRent = property.monthly_rent ? property.monthly_rent * 12 : 18000;
  const managementExpenses = grossRent * 0.15;
  const netBonificato = grossRent - managementExpenses;

  const html = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>MYCO Private Wealth - Executive Summary</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
        .brand { font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #0f172a; }
        .subbrand { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-top: 4px; }
        .doc-title { text-align: right; }
        .doc-title h1 { font-size: 14px; text-transform: uppercase; font-weight: 700; margin: 0; color: #0f172a; }
        .doc-title p { font-size: 10px; color: #64748b; margin: 2px 0 0 0; }
        
        .section-title { font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
        
        .kpi-grid { display: table; width: 100%; table-layout: fixed; margin-bottom: 30px; }
        .kpi-card { display: table-cell; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: left; }
        .kpi-card + .kpi-card { margin-left: 10px; }
        .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .kpi-value { font-size: 20px; font-weight: 700; margin-top: 6px; color: #0f172a; }
        .kpi-value.green { color: #059669; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        th { text-align: left; padding: 10px; border-bottom: 1px solid #0f172a; font-size: 9px; text-transform: uppercase; color: #64748b; }
        td { padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }

        .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 9px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">MYCO</div>
          <div class="subbrand">Private Wealth Concierge</div>
        </div>
        <div class="doc-title">
          <h1>Executive Asset Summary</h1>
          <p>Generato il ${new Date().toLocaleDateString('it-IT')}</p>
        </div>
      </div>

      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 18px; margin: 0; color: #0f172a;">${property.title}</h2>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">${property.address}, ${property.city}</p>
      </div>

      <div class="section-title">Sintesi Rendita Concierge</div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Canone Lordo</div>
          <div class="kpi-value">€ ${grossRent.toLocaleString('it-IT')}</div>
        </div>
        <div class="kpi-card" style="margin: 0 10px;">
          <div class="kpi-label">Spese & Fees Myco</div>
          <div class="kpi-value" style="color: #dc2626;">-€ ${managementExpenses.toLocaleString('it-IT')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Netto Bonificato</div>
          <div class="kpi-value green">€ ${netBonificato.toLocaleString('it-IT')}</div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 30px;">Avanzamento Cantiere & SAL</div>
      <table>
        <thead>
          <tr>
            <th>Lavoro / Intervento</th>
            <th>Categoria</th>
            <th>Budget Previsto</th>
            <th>Avanzamento %</th>
          </tr>
        </thead>
        <tbody>
          ${(budgetItems || []).length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Nessun intervento cantiere in corso</td></tr>' : ''}
          ${(budgetItems || []).map((item: any) => `
            <tr>
              <td><b>${item.description}</b></td>
              <td>${item.category}</td>
              <td>€ ${Number(item.budgeted_amount || 0).toLocaleString('it-IT')}</td>
              <td><b>${item.sal_percentage || 0}%</b></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        MYCO S.R.L. — Documento Riservato ad uso esclusivo del Titolare dell'Investimento
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}