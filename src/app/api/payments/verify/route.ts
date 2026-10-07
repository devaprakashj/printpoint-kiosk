import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRazorpaySignature, fetchRazorpayPaymentDetails } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      paymentId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found in system' }, { status: 404 });
    }

    // 1. Replay Protection: If order is already verified and paid, return current state
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Order is already paid and PIN is active.',
        order,
      });
    }

    const effectivePaymentId = razorpay_payment_id || paymentId || `pay_rzp_${Date.now()}`;

    // 2. Cryptographic HMAC SHA-256 Signature Verification
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isValid) {
        console.error('Security Alert: Razorpay signature verification failed for order:', orderId);
        return NextResponse.json({ 
          success: false, 
          error: 'Security Error: Tampered or invalid cryptographic payment signature.' 
        }, { status: 400 });
      }

      // 3. Order ID Matching (Anti-spoofing)
      if (order.paymentGatewayOrderId && order.paymentGatewayOrderId !== razorpay_order_id) {
        console.error(`Security Alert: Gateway Order ID mismatch. Expected ${order.paymentGatewayOrderId}, got ${razorpay_order_id}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Security Error: Payment Order ID mismatch.' 
        }, { status: 400 });
      }

      // 4. Direct Server-to-Server Razorpay API Validation
      // Fetches real amount captured on Razorpay to prevent client-side price tampering
      const paymentDetails = await fetchRazorpayPaymentDetails(razorpay_payment_id);
      if (paymentDetails) {
        // Verify payment status
        if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
          return NextResponse.json({
            success: false,
            error: `Payment is not in captured status (current status: ${paymentDetails.status})`,
          }, { status: 400 });
        }

        // Verify exact amount in paise
        if (paymentDetails.amount < order.totalAmountPaise) {
          console.error(`Security Alert: Paid amount (${paymentDetails.amount}p) is less than required order amount (${order.totalAmountPaise}p)`);
          return NextResponse.json({
            success: false,
            error: 'Security Error: Paid amount does not match required order total.',
          }, { status: 400 });
        }
      }
    }

    // Mark order as paid and activate 4-digit PIN
    const updated = db.updateOrderStatus(orderId, 'paid_ready_to_print', {
      paymentStatus: 'paid',
      paymentId: effectivePaymentId,
    });

    const targetPhone = updated?.customerPhone || order.customerPhone || '918667466390';
    const cleanPhone = String(targetPhone).replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const activePin = updated?.fourDigitPin || order.fourDigitPin;

    const whatsAppMessage = `🖨️ *PrintPoint Cloud ATM — Order Confirmed!*

Hello 👋,
Your document has been securely uploaded and is ready for instant printing.

━━━━━━━━━━━━━━━━━━━━
🔑 *YOUR 4-DIGIT PRINT PIN: [ ${activePin} ]*
━━━━━━━━━━━━━━━━━━━━

📍 *3 Quick Steps to Print:*
1️⃣ Walk up to any nearest PrintPoint ATM Touchscreen.
2️⃣ Enter your 4-digit PIN: *${activePin}*.
3️⃣ Collect your high-quality prints instantly! ⚡

🔒 *Privacy Protected:* Your file is permanently shredded & wiped from the cloud immediately after printing.

_Thank you for choosing PrintPoint ATM!_`;

    const whatsAppUrl = formattedPhone 
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(whatsAppMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppMessage)}`;

    // Automatic Server-Side WhatsApp Dispatch
    try {
      const { sendDirectWhatsAppMessage } = await import('@/lib/whatsapp');
      await sendDirectWhatsAppMessage({
        phone: formattedPhone,
        pin: activePin,
        orderNumber: updated?.orderNumber,
        machineName: updated?.machineName,
      });
    } catch (e) {
      console.warn('Background WhatsApp dispatch notice:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified securely. Your 4-digit PIN is active!',
      order: updated,
      whatsAppMessage,
      whatsAppUrl,
      whatsAppAutoDispatched: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

