import { NextRequest, NextResponse } from 'next/server';
import { uploadDocument } from '@/lib/storage';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = (formData.get('orderId') as string) || `ord_${Date.now()}`;
    const customFileName = (formData.get('fileName') as string) || file?.name || 'Document.pdf';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No document file provided for upload' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload directly to Supabase Storage Bucket ('printpoint-documents')
    const uploadResult = await uploadDocument({
      fileBuffer,
      fileName: customFileName,
      orderId,
      contentType: file.type || 'application/pdf',
    });

    if (!uploadResult.success) {
      return NextResponse.json({ success: false, error: uploadResult.error || 'Failed to upload document' }, { status: 500 });
    }

    // If orderId matches an existing order, update its file_storage_url in Supabase
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin
        .from('orders')
        .update({ file_storage_url: uploadResult.storagePath })
        .eq('id', orderId);
    } else {
      const order = db.getOrderById(orderId);
      if (order) {
        order.fileStorageUrl = uploadResult.storagePath;
      }
    }

    return NextResponse.json({
      success: true,
      storagePath: uploadResult.storagePath,
      fileSize: file.size,
      fileName: customFileName,
      message: 'Document securely uploaded to Supabase Storage Vault (AES-256 Encrypted).',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload processing error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
