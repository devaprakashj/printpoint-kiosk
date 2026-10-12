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

    // 1. Check in-memory fast cache first
    let jobStatus = orderId ? db.getHardwareJobStatus(orderId) : undefined;
    if (!jobStatus && orderNumber) jobStatus = db.getHardwareJobStatus(orderNumber);
    if (!jobStatus && pin) jobStatus = db.getHardwareJobStatus(pin);

    if (jobStatus) {
      return NextResponse.json({
        success: true,
        status: jobStatus.status,
        message: jobStatus.message,
        updatedAt: jobStatus.updatedAt,
      });
    }

    // 2. Check Supabase orders table
    if (isSupabaseConfigured && supabaseAdmin && (orderId || orderNumber || pin)) {
      try {
        let query = supabaseAdmin.from('orders').select('order_status, completed_at');
        if (orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
          query = query.eq('id', orderId);
        } else if (orderNumber) {
          query = query.eq('order_number', orderNumber);
        } else if (pin) {
          query = query.eq('four_digit_pin', String(pin).trim());
        }

        const { data: oData } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (oData) {
          const isCompleted = oData.order_status === 'completed';
          return NextResponse.json({
            success: true,
            status: isCompleted ? 'completed' : (oData.order_status === 'failed' ? 'failed' : 'spooling'),
            message: isCompleted ? 'Confirmed by CUPS' : 'Printing in progress',
            updatedAt: oData.completed_at || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[JOB-STATUS] Supabase query warning:', err);
      }
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
