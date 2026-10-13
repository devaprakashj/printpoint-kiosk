import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId') || '';
    const orderNumber = searchParams.get('orderNumber') || '';
    const pin = searchParams.get('pin') || '';

    // 1. If in-memory already confirms hardware completion, return immediately
    let jobStatus = orderId ? db.getHardwareJobStatus(orderId) : undefined;
    if (!jobStatus && orderNumber) jobStatus = db.getHardwareJobStatus(orderNumber);
    if (!jobStatus && pin) jobStatus = db.getHardwareJobStatus(pin);

    if (jobStatus?.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: jobStatus.message || 'Confirmed by CUPS',
        updatedAt: jobStatus.updatedAt,
      });
    }
    if (jobStatus?.status === 'failed') {
      return NextResponse.json({
        success: true,
        status: 'failed',
        message: jobStatus.message || 'CUPS print failed',
        updatedAt: jobStatus.updatedAt,
      });
    }

    // 2. Query Supabase (distributed source of truth across Vercel cloud and local dev)
    if (isSupabaseConfigured && supabaseAdmin && (orderId || orderNumber || pin)) {
      try {
        let query = supabaseAdmin.from('orders').select('id, order_number, four_digit_pin, order_status, completed_at');
        const isUuid = Boolean(orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId));

        if (isUuid) {
          query = query.eq('id', orderId);
        } else if (orderNumber) {
          query = query.eq('order_number', orderNumber);
        } else if (pin) {
          query = query.eq('four_digit_pin', String(pin).trim());
        }

        const { data: oData } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (oData) {
          if (oData.order_status === 'completed') {
            // Synchronize in-memory cache so subsequent checks are instant
            if (oData.id) db.setHardwareJobStatus(oData.id, 'completed', 'Hardware paper feed confirmed by CUPS');
            if (oData.order_number) db.setHardwareJobStatus(oData.order_number, 'completed', 'Hardware paper feed confirmed by CUPS');
            if (oData.four_digit_pin) db.setHardwareJobStatus(oData.four_digit_pin, 'completed', 'Hardware paper feed confirmed by CUPS');

            return NextResponse.json({
              success: true,
              status: 'completed',
              message: 'Hardware paper feed confirmed by CUPS',
              updatedAt: oData.completed_at || new Date().toISOString(),
            });
          }

          if (oData.order_status === 'failed') {
            return NextResponse.json({
              success: true,
              status: 'failed',
              message: 'Hardware print failed',
              updatedAt: oData.completed_at || new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('[JOB-STATUS] Supabase query warning:', err);
      }
    }

    // 3. Fallback: If in-memory has active spooling status, return it
    if (jobStatus) {
      return NextResponse.json({
        success: true,
        status: jobStatus.status,
        message: jobStatus.message,
        updatedAt: jobStatus.updatedAt,
      });
    }

    return NextResponse.json({
      success: true,
      status: 'pending',
      message: 'Waiting for CUPS print daemon...',
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
