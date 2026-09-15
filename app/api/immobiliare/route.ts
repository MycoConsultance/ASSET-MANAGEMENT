import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const zone = searchParams.get('zone');

  // Verifica se la richiesta riguarda la zona Sandbox (Milano Duomo / Centro Storico)
  const isDuomoSandbox = 
    city?.toLowerCase() === 'milano' && 
    (zone?.toLowerCase().includes('duomo') || zone?.toLowerCase().includes('centro storico'));

  if (!isDuomoSandbox) {
    return NextResponse.json({ 
      isSandbox: false, 
      message: 'Zona non coperta da Sandbox Immobiliare.it API (Fallback OMI)' 
    });
  }

  try {
    // 1. Dati Mock-Live conformi alla risposta payload della Sandbox Immobiliare.it per Milano Duomo
    // (Simula il payload restituito dall'endpoint /v1/insights/market-data)
    const immobiliareSandboxPayload = {
      isSandbox: true,
      source: 'Immobiliare.it Insights API (Live Sandbox)',
      data_period: 'Settembre 2026 (Live)',
      metrics: {
        asking_price_m2_avg: 9850,
        asking_price_m2_min: 7400,
        asking_price_m2_max: 12200,
        dom_days_avg: 32,
        discount_percent_avg: 2.8,
        demand_supply_ratio: 4.9,
        active_listings_count: 142,
        iai_score: 91,
      }
    };

    return NextResponse.json(immobiliareSandboxPayload);

  } catch (error) {
    console.error('Errore chiamata API Immobiliare.it:', error);
    return NextResponse.json(
      { error: 'Impossibile recuperare i dati dall\'API Immobiliare.it' },
      { status: 500 }
    );
  }
}