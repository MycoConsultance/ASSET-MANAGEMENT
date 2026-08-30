import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { action, propertyId, salPercentage, title, amountRequested, invoiceUrl, salId } = body;
  const supabase = createClient();

  if (action === 'CREATE_SAL_BY_PARTNER') {
    // 1. Inserimento SAL da parte dell'Impresa in stato IN_VERIFICA_MYCO
    const { data: sal, error } = await supabase.from('property_construction_sal').insert({
      property_id: propertyId,
      sal_percentage: salPercentage,
      title: title,
      amount_requested: amountRequested,
      invoice_url: invoiceUrl,
      status: 'IN_VERIFICA_MYCO',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notifica per lo Staff Myco
    const { data: prop } = await supabase.from('properties').select('title, user_id').eq('id', propertyId).single();
    if (prop) {
      await supabase.from('property_notifications').insert({
        property_id: propertyId,
        user_id: prop.user_id,
        title: '🚧 Nuovo SAL da Verificare',
        message: `L'impresa ha caricato il SAL ${salPercentage}% (${amountRequested}€) per${prop.title}. Richiesta in attesa di verifica Myco.`,
        type: 'SAL_SUBMITTED',
      });
    }

    return NextResponse.json({ success: true, sal });
  }

  if (action === 'MYCO_APPROVE_SAL') {
    // 2. Lo Staff Myco approva il SAL e lo inoltra all'Investitore
    await supabase.from('property_construction_sal')
      .update({ status: 'APPROVED_BY_MYCO' })
      .eq('id', salId);

    const { data: sal } = await supabase.from('property_construction_sal').select('*, properties(user_id, title)').eq('id', salId).single();
    
    if (sal) {
      await supabase.from('property_notifications').insert({
        property_id: sal.property_id,
        user_id: sal.properties.user_id,
        title: '✅ SAL Cantiere Verificato da Myco',
        message: `Myco ha verificato la congruenza dei lavori del SAL ${sal.sal_percentage}\% per${sal.properties.title}. Clicca per autorizzare il pagamento.`,
        type: 'SAL_MYCO_VERIFIED',
      });
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'INVESTOR_APPROVE_SAL') {
    // 3. L'investitore autorizza il pagamento finale
    await supabase.from('property_construction_sal')
      .update({ status: 'APPROVED_BY_INVESTOR' })
      .eq('id', salId);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
}