import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function LegacyTokenRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from('property_partners')
    .select('property_id')
    .eq('access_token', resolvedParams.token)
    .single();

  if (partner?.property_id) {
    redirect(`/shared/properties/${partner.property_id}?token=${resolvedParams.token}`);
  }

  redirect('/login');
}