import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { propertyId, email, role } = body;

  if (!propertyId || !email || !role) {
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
  }

  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

  const { data, error } = await supabase
    .from('property_partners')
    .insert({
      property_id: propertyId,
      partner_email: email,
      partner_role: role,
      access_token: token,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, partner: data, token });
}