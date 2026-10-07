import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No image file uploaded' }, { status: 400 });
    }

    // Validate image format
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Please upload a valid image (PNG, JPG, WEBP)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `kiosk_${Date.now()}_${cleanFileName}`;

    // 1. Try Supabase Storage first if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from('printpoint-documents')
          .upload(`kiosks/photos/${uniqueFileName}`, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (!error && data) {
          // Get public URL
          const { data: publicData } = supabaseAdmin.storage
            .from('printpoint-documents')
            .getPublicUrl(`kiosks/photos/${uniqueFileName}`);

          return NextResponse.json({
            success: true,
            photoUrl: publicData.publicUrl,
            message: 'Image uploaded to Supabase Storage successfully!',
          });
        }
      } catch (err) {
        console.error('[Supabase Photo Upload Error]:', err);
      }
    }

    // 2. Fallback: Save to public/uploads/kiosks/
    try {
      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'kiosks');
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }

      const filePath = path.join(publicUploadsDir, uniqueFileName);
      fs.writeFileSync(filePath, buffer);

      const localUrl = `/uploads/kiosks/${uniqueFileName}`;
      return NextResponse.json({
        success: true,
        photoUrl: localUrl,
        message: 'Image saved locally successfully!',
      });
    } catch (fsErr) {
      // 3. Base64 fallback if file system write fails
      const base64 = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        photoUrl: base64,
        message: 'Image processed as Data URL successfully!',
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Photo upload failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
