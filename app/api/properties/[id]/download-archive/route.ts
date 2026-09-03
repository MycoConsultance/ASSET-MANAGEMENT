import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import JSZip from 'jszip';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const supabase = createClient();

  try {
    const { data: docs, error } = await supabase
      .from('property_documents')
      .select('*')
      .eq('property_id', resolvedParams.id);

    if (error || !docs || docs.length === 0) {
      return NextResponse.json({ error: 'Nessun documento trovato per questo asset' }, { status: 404 });
    }

    const zip = new JSZip();

    for (const doc of docs) {
      if (doc.file_url) {
        try {
          const res = await fetch(doc.file_url);
          if (res.ok) {
            const blob = await res.arrayBuffer();
            zip.file(doc.file_name || `documento_${doc.id}.pdf`, blob);
          }
        } catch (fetchErr) {
          console.error(`Errore download file ${doc.file_url}:`, fetchErr);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Fascicolo_Digitale_${resolvedParams.id}.zip"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore durante la generazione dello ZIP' }, { status: 500 });
  }
}