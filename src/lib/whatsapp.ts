import { db } from './db';

/**
 * Dispatches WhatsApp message directly to customer's WhatsApp inbox.
 * Supports:
 * 1. Meta WhatsApp Cloud API (Graph API)
 * 2. UltraMsg WhatsApp Gateway (Instant setup with QR)
 * 3. Custom WhatsApp Webhook URL
 * 4. Local WhatsApp microservice
 */
export async function sendDirectWhatsAppMessage(params: {
  phone: string;
  pin: string;
  orderNumber?: string;
  machineName?: string;
}) {
  const { phone, pin, orderNumber, machineName } = params;

  const cleanPhone = String(phone).replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const messageText = `🖨️ *PrintPoint Cloud ATM — Order Confirmed!*

Hello 👋,
Your document has been securely uploaded and is ready for instant printing.

━━━━━━━━━━━━━━━━━━━━
🔑 *YOUR 4-DIGIT PRINT PIN: [ ${pin} ]*
━━━━━━━━━━━━━━━━━━━━

📍 *3 Quick Steps to Print:*
1️⃣ Walk up to any nearest PrintPoint ATM Touchscreen.
2️⃣ Enter your 4-digit PIN: *${pin}*.
3️⃣ Collect your high-quality prints instantly! ⚡

🔒 *Privacy Protected:* Your file is permanently shredded & wiped from the cloud immediately after printing.

_Thank you for choosing PrintPoint ATM!_`;

  const directWhatsAppUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(messageText)}`;

  let apiDispatched = false;
  let providerUsed = 'direct_web_url';

  // 1. UltraMsg WhatsApp Cloud Gateway (100% Vercel Serverless Ready 24/7)
  const ultraInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultraToken = process.env.ULTRAMSG_TOKEN;

  if (ultraInstance && ultraToken) {
    try {
      const ultraRes = await fetch(`https://api.ultramsg.com/${ultraInstance}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultraToken,
          to: `+${formattedPhone}`,
          body: messageText,
        }),
      });
      const ultraData = await ultraRes.json();
      if (ultraData.sent === 'true' || ultraData.id) {
        apiDispatched = true;
        providerUsed = 'ultramsg_gateway';
        console.log('[UltraMsg WhatsApp Cloud] Dispatched successfully:', ultraData);
      }
    } catch (e) {
      console.error('[UltraMsg WhatsApp Cloud] Error:', e);
    }
  }

  // 2. Meta Official WhatsApp Cloud API (100% Vercel Serverless Ready)
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiDispatched && metaToken && metaPhoneId) {
    try {
      const metaRes = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: messageText },
        }),
      });
      const metaData = await metaRes.json();
      if (metaRes.ok) {
        apiDispatched = true;
        providerUsed = 'meta_whatsapp_cloud_api';
        console.log('[Meta WhatsApp Cloud API] Dispatched successfully:', metaData);
      }
    } catch (e) {
      console.error('[Meta WhatsApp Cloud API] Network error:', e);
    }
  }

  // 3. Local WhatsApp Microservice Daemon (Local Dev / Kiosk PC)
  if (!apiDispatched) {
    try {
      const localRes = await fetch('http://127.0.0.1:5005/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          message: messageText,
        }),
      });
      if (localRes.ok) {
        const localData = await localRes.json();
        if (localData.success) {
          apiDispatched = true;
          providerUsed = 'local_whatsapp_bot';
          console.log('[Local WhatsApp Bot] Dispatched successfully:', localData);
        }
      }
    } catch (e) {
      // Local daemon might not be running on Vercel
    }
  }

  // 4. Generic WhatsApp Webhook
  const customWebhook = process.env.WHATSAPP_WEBHOOK_URL;
  if (!apiDispatched && customWebhook) {
    try {
      await fetch(customWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          message: messageText,
          pin,
          orderNumber,
          timestamp: new Date().toISOString(),
        }),
      });
      apiDispatched = true;
      providerUsed = 'custom_webhook';
    } catch (e) {
      console.warn('[Custom Webhook] Error:', e);
    }
  }

  console.log(`[WhatsApp Automated Engine] Prepared for +${formattedPhone}: \n${messageText}`);

  return {
    success: true,
    phone: formattedPhone,
    pin,
    messageText,
    directWhatsAppUrl,
    apiDispatched,
    providerUsed,
    timestamp: new Date().toISOString(),
  };
}
