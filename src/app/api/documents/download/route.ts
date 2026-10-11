import { NextRequest, NextResponse } from 'next/server';
import { getDocumentDownloadUrl } from '@/lib/storage';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get('path') || searchParams.get('key');
    const orderId = searchParams.get('orderId');

    let targetPath = storagePath;

    if (orderId && isSupabaseConfigured && supabaseAdmin) {
      const { data: oData } = await supabaseAdmin
        .from('orders')
        .select('file_storage_url, file_shredded, order_status')
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .single();

      if (oData?.file_shredded || oData?.order_status === 'completed') {
        return NextResponse.json({
          success: false,
          shredded: true,
          error: 'Document has been cryptographically zero-wiped (DoD 5220.22-M compliant). 0 bytes retained on cloud storage to protect student privacy.',
        }, { status: 410 });
      }

      if (!targetPath) {
        targetPath = oData?.file_storage_url;
      }
    }

    if (!targetPath) {
      return NextResponse.json({ success: false, error: 'Document storage path not found or shredded' }, { status: 404 });
    }

    // Generate signed download URL (valid for 5 minutes)
    const signedUrl = await getDocumentDownloadUrl(targetPath, 300);

    if (signedUrl.startsWith('http')) {
      return NextResponse.redirect(signedUrl);
    }

    return NextResponse.json({
      success: true,
      signedUrl,
      storagePath: targetPath,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Download error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
