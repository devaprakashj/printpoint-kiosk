import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

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
        const updatePayload: Record<string, any> = {
          order_status: status,
        };
        if (success) {
          updatePayload.completed_at = new Date().toISOString();
        }

        if (orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId))) {
          await supabaseAdmin.from('orders').update(updatePayload).eq('id', orderId);
        } else if (orderNumber) {
          await supabaseAdmin.from('orders').update(updatePayload).eq('order_number', orderNumber);
        } else if (pin) {
          await supabaseAdmin.from('orders').update(updatePayload).eq('four_digit_pin', String(pin).trim());
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
