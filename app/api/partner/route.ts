import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const propertyId = searchParams.get('propertyId');

  if (!token || !propertyId) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
  }

  const supabase = createClient();

  // 1. Verifica token e ruolo partner
  const { data: partner, error: partnerErr } = await supabase
    .from('property_partners')
    .select('*')
    .eq('access_token', token)
    .eq('property_id', propertyId)
    .single();

  if (partnerErr || !partner) {
    return NextResponse.json({ error: 'Magic Link non valido' }, { status: 401 });
  }

  // CONTROLLO SCADENZA TOKEN (Punto Cieco 2)
  if (partner.expires_at && new Date(partner.expires_at) < new Date()) {
    return NextResponse.json({
      error: 'TOKEN_EXPIRED',
      message: 'Il link di accesso temporaneo a questa pratica è scaduto per motivi di sicurezza.',
      partner_email: partner.partner_email,
      property_id: propertyId
    }, { status: 410 });
  }

  // 2. Recupero dati immobile
  const { data: property, error: propErr } = await supabase
    .from('properties')
    .select('*, profiles(full_name, email)')
    .eq('id', propertyId)
    .single();

  if (propErr || !property) {
    return NextResponse.json({ error: 'Immobile non trovato' }, { status: 404 });
  }

  // 3. Documenti firmati temporanei
  const { data: rawDocs } = await supabase
    .from('property_documents')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  let safeDocs: any[] = [];
  if (rawDocs && rawDocs.length > 0) {
    for (const doc of rawDocs) {
      const storagePath = doc.file_url.split('/property-documents/')[1];
      if (storagePath) {
        const { data: signedData } = await supabase.storage
          .from('property-documents')
          .createSignedUrl(storagePath, 3600);

        safeDocs.push({
          id: doc.id,
          file_name: doc.file_name,
          uploaded_by_role: doc.uploaded_by_role,
          created_at: doc.created_at,
          signed_url: signedData?.signedUrl || null,
        });
      }
    }
  }

  // 4. Role-Based Data Filtering
  const role = partner.partner_role;
  let filteredData: any = {
    partner_role: role,
    partner_email: partner.partner_email,
    documents: safeDocs,
    property: {
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      current_phase: property.current_phase,
    },
    investor: {
      full_name: property.profiles?.full_name || 'Investitore Myco',
    },
  };

  if (role === 'NOTAIO') {
    filteredData.property.purchase_price = property.purchase_price;
    filteredData.investor.email = property.profiles?.email;
  } else if (role === 'AGENTE') {
    filteredData.property.purchase_price = property.purchase_price;
  }

  return NextResponse.json(filteredData);
}

// ENDPOINT PER NOTIFICARE UPLOAD NOTAIO O RICHIEDERE RINNOVO TOKEN
export async function POST(request: Request) {
  const body = await request.json();
  const { action, propertyId, partnerEmail, fileName } = body;
  const supabase = createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('user_id, title')
    .eq('id', propertyId)
    .single();

  if (!property) return NextResponse.json({ error: 'Asset non trovato' }, { status: 404 });

  if (action === 'NOTIFY_UPLOAD') {
    // Genera notifica per l'investitore (Punto Cieco 3)
    await supabase.from('property_notifications').insert({
      property_id: propertyId,
      user_id: property.user_id,
      title: '📄 Nuovo Documento dal Partner',
      message: `Il partner (${partnerEmail}) ha caricato il file "${fileName}" per l'immobile ${property.title}.`,
      type: 'DOCUMENT_UPLOADED'
    });
    return NextResponse.json({ success: true });
  }

  if (action === 'REQUEST_TOKEN_RENEWAL') {
    // Richiesta di rinnovo token inviata all'investitore
    await supabase.from('property_notifications').insert({
      property_id: propertyId,
      user_id: property.user_id,
      title: '🔑 Richiesta Rinnovo Accesso Partner',
      message: `Il partner (${partnerEmail}) ha richiesto il rinnovo del Magic Link per l'immobile ${property.title}.`,
      type: 'MAGIC_LINK_EXPIRED'
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
}