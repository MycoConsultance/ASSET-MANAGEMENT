import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { property_id, partner_email, partner_name, partner_role } = await request.json();

    if (!property_id || !partner_email || !partner_role) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    // Genera un token crittografico sicuro a 32 byte
    const token = crypto.randomBytes(32).toString('hex');

    // Inserisce il token con validità 7 giorni
    const { data, error } = await supabase
      .from('partner_access_tokens')
      .insert({
        property_id,
        partner_email,
        partner_name,
        partner_role,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Costruisce il Magic Link per la mail
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const magicLink = `${siteUrl}/p/${token}`;

    return NextResponse.json({
      success: true,
      magicLink,
      tokenData: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
