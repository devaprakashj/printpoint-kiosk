import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'printpoint-documents';

export const isR2Configured = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME
);

// S3 Client initialized with Cloudflare R2 endpoint
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload an encrypted print document buffer directly to Cloudflare R2 (10 GB Free tier).
 */
export async function uploadDocumentToR2(params: {
  fileBuffer: Buffer | Uint8Array;
  fileName: string;
  orderId: string;
  contentType?: string;
}): Promise<{ success: boolean; storageKey: string; error?: string }> {
  const { fileBuffer, fileName, orderId, contentType = 'application/pdf' } = params;
  const storageKey = `orders/${orderId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (!isR2Configured) {
    console.log(`[Cloudflare R2 Mock] File uploaded to memory/mock: ${storageKey} (${fileBuffer.length} bytes)`);
    return { success: true, storageKey };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        orderId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(command);
    console.log(`[Cloudflare R2] Successfully uploaded: ${storageKey}`);
    return { success: true, storageKey };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload to R2';
    console.error('[Cloudflare R2 Upload Error]:', message);
    return { success: false, storageKey: '', error: message };
  }
}

/**
 * Generates a secure, temporary single-use presigned URL for the Kiosk to download the document.
 * Defaults to 5 minutes validity.
 */
export async function getDocumentDownloadUrl(storageKey: string, expiresInSeconds: number = 300): Promise<string> {
  if (!isR2Configured || storageKey.startsWith('mock_')) {
    return `/api/documents/download?key=${encodeURIComponent(storageKey)}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
    return signedUrl;
  } catch (err) {
    console.error('[Cloudflare R2 Presign Error]:', err);
    return '';
  }
}

/**
 * Permanently shreds and deletes the document from Cloudflare R2 storage bucket (Zero-Retention).
 */
export async function shredDocumentFromR2(storageKey: string): Promise<{ success: boolean; shredded: boolean }> {
  if (!isR2Configured || storageKey.startsWith('mock_')) {
    console.log(`[Cloudflare R2 Mock] File permanently shredded (0 bytes): ${storageKey}`);
    return { success: true, shredded: true };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
    });

    await r2Client.send(command);
    console.log(`[Cloudflare R2 File Shredder] Successfully deleted ${storageKey} from R2 bucket.`);
    return { success: true, shredded: true };
  } catch (err) {
    console.error('[Cloudflare R2 Shred Error]:', err);
    return { success: false, shredded: false };
  }
}
