import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, phone, pin, orderNumber, machineName } = body;

    let targetOrder = orderId ? db.getOrderById(orderId) : null;
    const targetPin = pin || targetOrder?.fourDigitPin || '2179';
    const targetPhone = phone || targetOrder?.customerPhone || '918667466390';

    const result = await sendDirectWhatsAppMessage({
      phone: targetPhone,
      pin: targetPin,
      orderNumber: orderNumber || targetOrder?.orderNumber,
      machineName: machineName || targetOrder?.machineName,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
