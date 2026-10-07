# 🖨️ Print ATM: Autonomous Self-Service Printing & Xerox SaaS Platform

A production-ready, scalable SaaS platform for self-service printing kiosks (Print ATMs) and Xerox shop stations, designed for universities, colleges (e.g., RIT Chennai), libraries, hostels, and retail locations.

---

## 🚀 Live Portals & Features

1. **📱 Customer Mobile-First Flow (`/kiosk/RIT-ATM-01`)**:
   - Zero-app mobile web app (Safari / Chrome).
   - Drag & drop document upload with automatic page count detection.
   - Dynamic options: B&W / Color, Single-Sided / Duplex, Copies, Custom Page Ranges (`1-5, 8, 10-12`).
   - Real-time dynamic price engine quotation.
   - Instant UPI / Card checkout (Razorpay & Mock Sandbox).
   - Generates a **Secure 4-Digit Release PIN** (valid for 2 hours) with live countdown timer.

2. **🖥️ Kiosk Touchscreen ATM Mode (`/touchscreen/RIT-ATM-01`)**:
   - Fullscreen Touchscreen UI with on-screen virtual numeric keypad `[ 1 .. 9, 0, Clear, ⌫, Verify ]`.
   - Tactile audio click and chime feedback synthesized via Web Audio API.
   - Instant 4-digit PIN verification and order summary display.
   - Animated printing progress bar (`Downloading` ➡️ `Warming up` ➡️ `Feeding Paper` ➡️ `Delivered`).
   - 15-second automatic session reset with permanent secure file shredding.

3. **💻 Xerox Shop / Counter Station Mode (`/shop-dashboard`)**:
   - Assisted counter portal for existing stationery and printing shops.
   - Live incoming paid orders queue.
   - Token & PIN search lookup.
   - 1-Click print execution to shop's commercial printer.
   - Eliminates WhatsApp sharing and pen-drive viruses.

4. **📊 Multi-Tenant Admin & Fleet Command (`/admin`)**:
   - Organization management (RIT Chennai, etc.).
   - Live machine fleet telemetry: Paper level, toner health, internal temperature, cabinet door security status.
   - 1-Click "+ Refill Paper (500 sheets)" action.
   - Real-time campus pricing matrix editor.
   - Revenue analytics and print volume reports.

---

## ⚡ 1-Click Deployment on Vercel

The entire full-stack application is 100% serverless and ready for Vercel:

1. Push this repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Click **Deploy**. Vercel will build and host the entire platform with HTTPS and global CDN.

---

## 💻 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 📁 Project Architecture

```
print-atm/
├── src/
│   ├── app/
│   │   ├── page.tsx                           # Main Landing & Portal Hub
│   │   ├── (customer)/kiosk/[machineCode]/    # Customer Mobile Upload & PIN
│   │   ├── (kiosk)/touchscreen/[machineCode]/ # ATM Touchscreen Keypad
│   │   ├── (shop)/shop-dashboard/             # Xerox Shop Live Queue
│   │   ├── (admin)/admin/                     # Fleet Management & Pricing
│   │   └── api/                               # Serverless Backend API Handlers
│   ├── components/                            # TouchKeypad, Navbar, Badges
│   └── lib/                                   # Database, Pricing Engine, Sounds
├── agent/                                     # Optional Python Hardware Agent
└── docs/                                      # Full Engineering Specifications
```
