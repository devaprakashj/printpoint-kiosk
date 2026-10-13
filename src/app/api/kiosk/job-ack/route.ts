import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { shredDocument } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderNumber, pin, success, message } = body;

    const status = success ? 'completed' : 'failed';
    const statusMsg = message || (success ? 'Hardware paper feed confirmed by CUPS' : 'Printing failed');

    if (orderId) db.setHardwareJobStatus(orderId, status, statusMsg);
    if (orderNumber) db.setHardwareJobStatus(orderNumber, status, statusMsg);
    if (pin) db.setHardwareJobStatus(String(pin).trim(), status, statusMsg);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let q = supabaseAdmin.from('orders').select('id, file_storage_url');
        if (orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId))) {
          q = q.eq('id', orderId);
        } else if (orderNumber) {
          q = q.eq('order_number', orderNumber);
        } else if (pin) {
          q = q.eq('four_digit_pin', String(pin).trim());
        }

        const { data: matchedOrder } = await q.maybeSingle();

        const updatePayload: Record<string, any> = {
          order_status: status,
        };
        if (success) {
          const completedAt = new Date().toISOString();
          updatePayload.completed_at = completedAt;
          updatePayload.file_shredded = true;
          updatePayload.shredded_at = completedAt;
          updatePayload.file_storage_url = null;

          if (matchedOrder?.file_storage_url) {
            Promise.resolve().then(() => shredDocument(matchedOrder.file_storage_url)).catch(() => {});
          }
        }

        if (matchedOrder?.id) {
          await supabaseAdmin.from('orders').update(updatePayload).eq('id', matchedOrder.id);
        }
      } catch (err) {
        console.error('[JOB-ACK] Supabase update warning:', err);
      }
    }

    console.log(`[JOB-ACK CONFIRMED] order=${orderId || orderNumber || pin}, status=${status}, msg=${statusMsg}`);
    return NextResponse.json({ success: true, acknowledged: true, status, message: statusMsg });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
