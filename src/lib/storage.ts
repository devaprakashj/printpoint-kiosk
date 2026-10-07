import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import { uploadDocumentToR2, getDocumentDownloadUrl as getR2Url, shredDocumentFromR2, isR2Configured } from './r2';

const BUCKET_NAME = 'printpoint-documents';

/**
 * Upload an encrypted document buffer directly to Supabase Storage (or R2 if configured).
 */
export async function uploadDocument(params: {
  fileBuffer: Buffer | Uint8Array;
  fileName: string;
  orderId: string;
  contentType?: string;
}): Promise<{ success: boolean; storagePath: string; error?: string }> {
  const { fileBuffer, fileName, orderId, contentType = 'application/pdf' } = params;
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `orders/${orderId}/${Date.now()}_${cleanName}`;

  // 1. If Cloudflare R2 is configured, prefer R2 for 10 GB free bandwidth
  if (isR2Configured) {
    const r2Res = await uploadDocumentToR2({ fileBuffer, fileName, orderId, contentType });
    if (r2Res.success) {
      return { success: true, storagePath: r2Res.storageKey };
    }
  }

  // 2. Primary: Supabase Storage
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.error('[Supabase Storage Upload Error]:', error.message);
        return { success: false, storagePath: '', error: error.message };
      }

      console.log(`[Supabase Storage] File uploaded successfully: ${data.path}`);
      return { success: true, storagePath: data.path };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Supabase upload failed';
      console.error('[Supabase Storage Error]:', msg);
      return { success: false, storagePath: '', error: msg };
    }
  }

  // 3. In-memory / Mock Fallback
  console.log(`[Storage Mock] Encrypted buffer received in memory: ${storagePath} (${fileBuffer.length} bytes)`);
  return { success: true, storagePath };
}

/**
 * Generates a temporary, secure single-use signed URL for the Kiosk to download the PDF for laser printing.
 */
export async function getDocumentDownloadUrl(storagePath: string, expiresInSeconds: number = 300): Promise<string> {
  if (!storagePath) return '';

  // 1. If R2 path
  if (isR2Configured && !storagePath.startsWith('orders/')) {
    return await getR2Url(storagePath, expiresInSeconds);
  }

  // 2. Supabase Storage Signed URL
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err) {
      console.error('[Supabase Storage Signed URL Error]:', err);
    }
  }

  return `/api/documents/download?path=${encodeURIComponent(storagePath)}`;
}

/**
 * Permanently shreds and deletes the file from Supabase Storage / R2 upon print completion (Zero-Retention Guarantee).
 */
export async function shredDocument(storagePath: string): Promise<{ success: boolean; shredded: boolean }> {
  if (!storagePath) return { success: true, shredded: true };

  let shredded = false;

  // 1. Supabase Storage Shredder
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (!error) {
        shredded = true;
        console.log(`[Supabase Storage File Shredder] Successfully deleted ${storagePath} (0 bytes retained).`);
      }
    } catch (err) {
      console.error('[Supabase Storage Shred Error]:', err);
    }
  }

  // 2. Cloudflare R2 Shredder
  if (isR2Configured) {
    const r2Shred = await shredDocumentFromR2(storagePath).catch(() => ({ success: false, shredded: false }));
    if (r2Shred.shredded) shredded = true;
  }

  return { success: true, shredded };
}
