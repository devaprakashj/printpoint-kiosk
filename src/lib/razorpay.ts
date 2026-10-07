import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TkshNTlCnY93w2';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '2F6l1M8Eq1XwgRUulemb6hIh';

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

/**
 * Creates a Razorpay Order using native fetch with Basic Auth
 */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse | null> {
  try {
    const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    
    // Razorpay minimum amount is 100 paise (₹1)
    const amount = Math.max(100, Math.round(params.amountPaise));

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: params.receipt.substring(0, 40),
        notes: params.notes || {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Razorpay Order API error:', errorData);
      return null;
    }

    const orderData: RazorpayOrderResponse = await response.json();
    return orderData;
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return null;
  }
}

/**
 * Verifies Razorpay Payment Signature using HMAC SHA-256
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
    const { orderId, paymentId, signature } = params;
    if (!orderId || !paymentId || !signature) return false;

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Fetches actual payment details directly from Razorpay API
 * Used to verify the exact amount captured and payment status server-side (anti-tamper)
 */
export async function fetchRazorpayPaymentDetails(paymentId: string): Promise<{
  id: string;
  amount: number; // in paise
  status: string; // 'captured', 'authorized', 'failed'
  order_id: string;
  currency: string;
  method: string;
} | null> {
  try {
    if (!paymentId || paymentId.startsWith('pay_mock')) return null;

    const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      console.warn(`Razorpay Payment API returned ${response.status} for ${paymentId}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching Razorpay payment details:', err);
    return null;
  }
}

