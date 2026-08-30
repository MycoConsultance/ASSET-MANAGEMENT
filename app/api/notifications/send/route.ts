import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, recipientEmail, recipientName, propertyTitle, propertyAddress, extraData } = body;
    const supabase = createClient();

    let emailSubject = '';
    let emailHtml = '';

    // 1. TEMPLATE: INVITO MAGIC LINK PARTNER
    if (type === 'MAGIC_LINK_INVITE') {
      emailSubject = `Fascicolo Digitale Myco Concierge - Accesso Pratica ${propertyTitle}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1A1A1A;">
          <h2 style="color: #3E4D40;">Myco Asset Management</h2>
          <p>Gentile Professionista,</p>
          <p>Le è stato fornito l'accesso al Fascicolo Digitale per la pratica relativa all'immobile <strong>${propertyTitle}</strong> (${propertyAddress}).</p>
          <p>Può consultare i dati di Sua competenza e caricare la documentazione richiesta al seguente link sicuro:</p>
          <p style="margin: 25px 0;">
            <a href="${extraData?.magicLink}" style="background-color: #3E4D40; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Apri Fascicolo Condiviso →
            </a>
          </p>
          <p style="font-size: 11px; color: #666;">Nota: Il link è strettamente riservato ed ha validità temporanea per motivi di sicurezza.</p>
        </div>
      `;
    }

    // 2. TEMPLATE: NOTIFICA NUOVO DOCUMENTO/SAL ALL'INVESTITORE
    else if (type === 'DOCUMENT_UPLOADED_ALERT') {
      emailSubject = `[Myco Concierge] Nuovo Documento caricato per ${propertyTitle}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1A1A1A;">
          <h2 style="color: #3E4D40;">Aggiornamento Asset Care</h2>
          <p>Gentile ${recipientName || 'Investitore'},</p>
          <p>La informiamo che è stato caricato un nuovo documento nel Fascicolo Digitale dell'immobile <strong>${propertyTitle}</strong>.</p>
          <ul>
            <li><strong>Mittente:</strong> ${extraData?.uploadedByRole || 'Partner Esterno'}</li>
            <li><strong>Nome File:</strong> ${extraData?.fileName}</li>
          </ul>
          <p style="margin: 25px 0;">
            <a href="${extraData?.dashboardUrl}" style="background-color: #3E4D40; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accedi alla Scheda Asset →
            </a>
          </p>
        </div>
      `;
    }

    // 3. TEMPLATE: ALERT ANTI-SFITTO (60 GIORNI)
    else if (type === 'LEASE_EXPIRING_ALERT') {
      emailSubject = `[Myco Anti-Sfitto] Contratto in Scadenza - ${propertyTitle}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1A1A1A;">
          <h2 style="color: #D97706;">Alert Strategia Patrimoniale</h2>
          <p>Gentile ${recipientName || 'Investitore'},</p>
          <p>Il contratto di locazione transitoria per l'immobile <strong>${propertyTitle}</strong> scadrà tra <strong>${extraData?.daysLeft} giorni</strong> (${extraData?.tenantName}).</p>
          <p>Per garantire sfizio zero (zero sfitto) e mantenere invariato il Suo cash flow mensile, il team Myco è pronto ad avviare la ricandidatura dell'asset sul mercato.</p>
          <p style="margin: 25px 0;">
            <a href="${extraData?.dashboardUrl}" style="background-color: #D97706; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Conferma Ricandidatura Asset →
            </a>
          </p>
        </div>
      `;
    }

    // SIMULAZIONE LOG DI INVIO (In ambiente di produzione si usa resend.emails.send() o sendgrid)
    console.log(`[EMAIL DISPATCH] A: ${recipientEmail} | Oggetto: ${emailSubject}`);

    // Registrazione della notifica sul DB
    await supabase.from('property_notifications').insert({
      property_id: extraData?.propertyId,
      title: emailSubject,
      message: `Email inviata a ${recipientEmail}`,
      type: type,
      is_read: true
    });

    return NextResponse.json({
      success: true,
      message: `Email inviata con successo a ${recipientEmail}`,
      previewSubject: emailSubject
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}