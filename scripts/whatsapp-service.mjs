import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authPath = path.join(__dirname, '../whatsapp_auth');

let sock = null;
let isConnected = false;
let currentQrDataUrl = null;
let currentRawQr = null;

async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentRawQr = qr;
      currentQrDataUrl = await QRCode.toDataURL(qr, { width: 360, margin: 2 });
      console.log('\n===============================================================');
      console.log('📌 SCAN THIS QR CODE IN WHATSAPP (Linked Devices -> Link a Device):');
      console.log('Or Open http://localhost:5005 in your browser to scan from screen!');
      console.log('===============================================================\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log('===============================================================\n');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[WhatsApp Bot] Connection closed. StatusCode:', statusCode, 'Reconnecting:', shouldReconnect);
      isConnected = false;
      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 3000);
      }
    } else if (connection === 'open') {
      console.log('\n✅ [WhatsApp Bot] Connected successfully to WhatsApp!');
      console.log('🚀 Ready to send automated PINs to customers upon payment!\n');
      isConnected = true;
      currentQrDataUrl = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// HTTP Server for Next.js backend & easy browser scanning
const PORT = 5005;
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Web Browser UI to scan QR code directly from screen
  if (req.method === 'GET' && (req.url === '/' || req.url === '/qr')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (isConnected) {
      res.writeHead(200);
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PrintPoint WhatsApp Bot - Connected</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; background: #0b141a; color: #e9edef; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #111b21; border: 1px solid #222e35; border-radius: 16px; padding: 40px; text-align: center; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .badge { background: #00a884; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
            h1 { font-size: 22px; margin: 0 0 10px; color: #fff; }
            p { color: #8696a0; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✅ ACTIVE & CONNECTED</div>
            <h1>PrintPoint WhatsApp Engine</h1>
            <p>Your WhatsApp is linked and active. Automated PINs will be dispatched to customers immediately upon payment!</p>
          </div>
        </body>
        </html>
      `);
      return;
    }

    if (currentQrDataUrl) {
      res.writeHead(200);
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link WhatsApp - PrintPoint</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="refresh" content="15">
          <style>
            body { font-family: system-ui, sans-serif; background: #0b141a; color: #e9edef; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #111b21; border: 1px solid #222e35; border-radius: 20px; padding: 32px; text-align: center; max-width: 440px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
            .qr-box { background: white; padding: 16px; border-radius: 12px; display: inline-block; margin: 20px 0; }
            .qr-box img { display: block; width: 260px; height: 260px; }
            h1 { font-size: 20px; margin: 0 0 8px; color: #fff; }
            ol { text-align: left; color: #8696a0; font-size: 13px; line-height: 1.7; padding-left: 20px; margin: 16px 0; }
            .hint { font-size: 12px; color: #00a884; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link PrintPoint WhatsApp Bot</h1>
            <div class="qr-box">
              <img src="${currentQrDataUrl}" alt="Scan QR Code" />
            </div>
            <ol>
              <li>Open WhatsApp on your phone</li>
              <li>Tap <b>Menu (⋮)</b> or <b>Settings</b> ➔ <b>Linked Devices</b></li>
              <li>Tap <b>Link a Device</b> and point your phone at this screen</li>
            </ol>
            <div class="hint">⚡ Page auto-refreshes if QR updates</div>
          </div>
        </body>
        </html>
      `);
      return;
    }

    res.writeHead(200);
    res.end('<h1>Initializing WhatsApp Engine... Please refresh in 3 seconds.</h1><script>setTimeout(()=>location.reload(), 2000)</script>');
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ status: isConnected ? 'connected' : 'disconnected' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    res.setHeader('Content-Type', 'application/json');
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body);
        if (!phone || !message) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'phone and message are required' }));
          return;
        }

        if (!isConnected || !sock) {
          res.writeHead(503);
          res.end(
            JSON.stringify({
              success: false,
              error: 'WhatsApp Bot not connected yet. Please scan the QR code at http://localhost:5005.',
            })
          );
          return;
        }

        const cleanPhone = String(phone).replace(/\D/g, '');
        const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const jid = `${formattedPhone}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: message });
        console.log(`[WhatsApp Bot] Sent automated message to +${formattedPhone}`);

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, phone: formattedPhone }));
      } catch (err) {
        console.error('[WhatsApp Bot] Error sending message:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[WhatsApp Daemon] Microservice listening on http://127.0.0.1:${PORT}`);
  startWhatsAppBot();
});
