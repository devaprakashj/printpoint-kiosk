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

    if (!targetPath && orderId && isSupabaseConfigured && supabaseAdmin) {
      const { data: oData } = await supabaseAdmin
        .from('orders')
        .select('file_storage_url')
        .eq('id', orderId)
        .single();

      targetPath = oData?.file_storage_url;
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
