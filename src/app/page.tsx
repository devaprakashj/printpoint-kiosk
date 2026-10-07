'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  UploadCloud, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Smartphone, 
  ChevronRight, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Sparkles, 
  QrCode, 
  Layers, 
  ArrowRight, 
  HelpCircle, 
  MessageCircle, 
  Check, 
  Lock, 
  ExternalLink,
  ChevronDown,
  Building2,
  Users,
  Award,
  RefreshCw,
  Sliders,
  DollarSign,
  Plus,
  Minus,
  Menu,
  X
} from 'lucide-react';
import { Machine } from '@/lib/types';
import Logo from '@/components/Logo';

export default function QwikprintStyleLandingPage() {
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Kiosks Data from API
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);

  // Interactive Live Calculator State
  const [calcPages, setCalcPages] = useState<number>(10);
  const [calcColor, setCalcColor] = useState<'bw' | 'color'>('bw');
  const [calcDuplex, setCalcDuplex] = useState<boolean>(true);

  // FAQ Accordion State (Index of open FAQ)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Campus Partnership State
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    collegeName: '',
    contactName: '',
    phone: '',
    studentCount: '3000+',
  });

  useEffect(() => {
    fetch('/api/machines')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.machines) {
          setMachines(data.machines);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMachines(false));
  }, []);

  // Calculated Price
  const estimatedTotal = (() => {
    const rate = calcColor === 'color' ? 10 : 2;
    const duplexMultiplier = calcDuplex ? 0.85 : 1;
    return Math.max(2, Math.round(calcPages * rate * duplexMultiplier));
  })();

  const estimatedSheets = calcDuplex ? Math.ceil(calcPages / 2) : calcPages;

  const faqs = [
    {
      q: 'How do I print a document at the PrintPoint ATM?',
      a: 'Simply tap "Launch Web App" on your mobile or laptop, upload your PDF or Word document, choose your print settings, pay securely via UPI (GPay/PhonePe), and you will instantly receive a secret 4-digit PIN on your WhatsApp. Walk up to any nearby PrintPoint ATM kiosk, enter your 4-digit PIN on the touchscreen, and collect your prints in 30 seconds!'
    },
    {
      q: 'What file formats are supported?',
      a: 'PrintPoint supports all standard student and office document formats including PDF (.pdf), Microsoft Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel (.xls, .xlsx), Rich Text (.rtf), Plain Text (.txt), and high-resolution images (.jpg, .png).'
    },
    {
      q: 'Is my document privacy and confidential data safe?',
      a: 'Yes, 100%! We enforce a strict Zero-Knowledge Architecture. Your documents are encrypted with AES-256 in memory and are permanently wiped using DoD 5220.22-M cryptographic zero-shredding the exact millisecond printing finishes at the kiosk. No files remain stored on any disk or cloud server.'
    },
    {
      q: 'What happens if a payment is deducted but no PIN is received?',
      a: 'Our smart payment webhook reconciles every transaction in real-time. If there is any network delay, our automated WhatsApp engine will deliver your PIN within 60 seconds. In case of any kiosk hardware error, an instant 100% automated UPI refund is triggered directly back to your bank account.'
    },
    {
      q: 'Can I dispense blank A4 paper sheets for exams and assignments?',
      a: 'Yes! Our ATM kiosks carry premium 80 GSM ultra-white stationery-grade A4 sheets that you can dispense directly starting at just ₹2 per sheet without needing to print anything.'
    },
    {
      q: 'How can our college or university install a PrintPoint ATM?',
      a: 'We offer zero-capex turnkey installations for universities, hostels, libraries, and tech parks. We handle machine setup, cloud IoT integration, paper restocking, and 24/7 maintenance. Simply fill the "Host a Kiosk" form below or reach out to our team on WhatsApp.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f0faf2] text-slate-900 font-sans selection:bg-[#00a61c] selection:text-white relative">
      {/* Subtle 2030 Ambient Ambient Background Mesh */}
      <div className="fixed inset-0 bg-mint-grid pointer-events-none -z-20 opacity-90" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-300/20 via-emerald-100/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* ================= 1. TOP NAVBAR ================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-emerald-100/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo Component */}
          <Logo size="md" />

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-[#00a61c] transition-colors">
              How It Works
            </a>
            <a href="#calculator" className="hover:text-[#00a61c] transition-colors">
              Pricing
            </a>
            <a href="#kiosks" className="hover:text-[#00a61c] transition-colors">
              Kiosks Network
            </a>
            <a href="#why-us" className="hover:text-[#00a61c] transition-colors">
              Why PrintPoint
            </a>
            <a href="#campus" className="hover:text-[#00a61c] transition-colors">
              Host a Kiosk
            </a>
            <a href="#faq" className="hover:text-[#00a61c] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#00a61c] hover:bg-emerald-50/60 transition-all border border-slate-200/80 bg-white/50"
            >
              <span>Admin Console</span>
            </Link>

            <Link
              href="/upload"
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-[#00a61c] hover:bg-[#008f18] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 flex items-center gap-1.5 sm:gap-2 active:scale-95 transition-all"
            >
              <UploadCloud className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline-block" />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-100 bg-white/95 backdrop-blur-xl px-4 py-5 space-y-4 shadow-xl animate-fade-in">
            <nav className="flex flex-col space-y-3 font-semibold text-sm text-slate-700">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#00a61c] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#00a61c] transition-colors"
              >
                Live Price Calculator
              </a>
              <a
                href="#kiosks"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#00a61c] transition-colors"
              >
                Live Kiosks Network
              </a>
              <a
                href="#why-us"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#00a61c] transition-colors"
              >
                Why PrintPoint
              </a>
              <a
                href="#campus"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#00a61c] transition-colors"
              >
                Host a Kiosk on Campus
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#00a61c] transition-colors"
              >
                Frequently Asked Questions
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/kiosk"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 text-center font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Open Kiosk ATM Terminal
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-center font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Admin Control Room
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ================= 2. HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* 2030 Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-emerald-200/80 text-[#008f18] text-xs font-semibold shadow-xs backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>India's 1st 24/7 Autonomous Cloud Laser Printing ATM Network</span>
            </div>

            {/* Exact Headline from User Reference */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#050505] tracking-tight leading-[1.12]">
              Be Part of <span className="text-[#00a61c]">India's Next-</span> <br className="hidden sm:inline" />
              <span className="text-[#00a61c]">Generation</span> Printing Network
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Never stand in crowded Xerox shop queues again. Upload your documents from your mobile, pay seamlessly via UPI, get your 4-digit PIN on WhatsApp, and collect crisp laser prints in 30 seconds at any ATM kiosk.
            </p>

            {/* Micro Highlights Badges */}
            <div className="pt-2 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>30-Sec Fast Print</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Zero-Knowledge Privacy</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-2xs">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct WhatsApp PIN</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>24/7 Campus Access</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. 3-STEP "HOW IT WORKS" ================= */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white/90 backdrop-blur-md border-y border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[#008f18] text-xs font-semibold tracking-wide">
              FRICTIONLESS WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#050505] tracking-tight">
              How PrintPoint ATM Works
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-normal">
              From uploading your document to grabbing fresh warm prints in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-[#f7fcf8] border border-emerald-200/70 space-y-5 hover:border-[#00a61c] hover:shadow-xl hover:shadow-emerald-600/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 text-[#008f18] font-bold text-lg flex items-center justify-center shadow-xs group-hover:bg-[#00a61c] group-hover:text-white transition-all">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Upload & Customise
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Open the web app on your phone or laptop. Upload PDF, Word, PPT or Images. Select Black & White or Color, Copies, Page Range, and Duplex (save paper).
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#008f18]">
                <Check className="w-4 h-4" />
                <span>No app installation required</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-[#f7fcf8] border border-emerald-200/70 space-y-5 hover:border-[#00a61c] hover:shadow-xl hover:shadow-emerald-600/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 text-[#008f18] font-bold text-lg flex items-center justify-center shadow-xs group-hover:bg-[#00a61c] group-hover:text-white transition-all">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                UPI Pay & WhatsApp PIN
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Pay seamlessly with any UPI App (GPay, PhonePe, Paytm, CRED). Your secret 4-digit PIN is immediately generated and sent to your WhatsApp.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#008f18]">
                <Check className="w-4 h-4" />
                <span>Instant 2-sec automated verification</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-[#f7fcf8] border border-emerald-200/70 space-y-5 hover:border-[#00a61c] hover:shadow-xl hover:shadow-emerald-600/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 text-[#008f18] font-bold text-lg flex items-center justify-center shadow-xs group-hover:bg-[#00a61c] group-hover:text-white transition-all">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Punch PIN & Collect Prints
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Walk up to any PrintPoint ATM in campus or hostel. Tap your 4-digit PIN on the responsive touchscreen. The high-speed laser fuser dispenses your prints instantly.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#008f18]">
                <Check className="w-4 h-4" />
                <span>Zero queue wait time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. INTERACTIVE LIVE COST CALCULATOR ================= */}
      <section id="calculator" className="py-20 sm:py-28 bg-[#f0faf2]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="px-3.5 py-1.5 rounded-full bg-white border border-emerald-200/80 text-[#008f18] text-xs font-semibold tracking-wide">
              HONEST & TRANSPARENT
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#050505] tracking-tight">
              Live Cost & Savings Calculator
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal">
              Calculate your exact printing budget with zero hidden costs or extra charges.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200/80 bg-white/90 backdrop-blur-md p-7 sm:p-10 shadow-xl shadow-emerald-950/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Controls Left Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Slider for Pages */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm font-bold text-slate-800">
                  <span>Number of Document Pages:</span>
                  <span className="text-[#008f18] font-mono text-base font-extrabold">{calcPages} Pages</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={calcPages}
                  onChange={e => setCalcPages(parseInt(e.target.value) || 1)}
                  className="w-full accent-[#00a61c] h-2.5 bg-slate-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>1 page</span>
                  <span>50 pages</span>
                  <span>120 pages</span>
                </div>
              </div>

              {/* Color Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Print Quality / Color Mode:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCalcColor('bw')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      calcColor === 'bw'
                        ? 'bg-[#e9f9ee] border-[#00a61c] text-[#008f18] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-sm">Black & White</div>
                    <div className="text-xs opacity-80 font-medium mt-0.5">₹2.00 / page</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcColor('color')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      calcColor === 'color'
                        ? 'bg-[#e9f9ee] border-[#00a61c] text-[#008f18] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-sm">High-Res Color</div>
                    <div className="text-xs opacity-80 font-medium mt-0.5">₹10.00 / page</div>
                  </button>
                </div>
              </div>

              {/* Duplex Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">Duplex Printing (Both Sides)</div>
                  <div className="text-xs text-slate-500 font-normal">Save 15% on paper consumption</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCalcDuplex(!calcDuplex)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    calcDuplex
                      ? 'bg-[#00a61c] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {calcDuplex ? 'Enabled (Save 15%)' : 'Single Sided'}
                </button>
              </div>
            </div>

            {/* Output Right Column */}
            <div className="lg:col-span-5 p-8 rounded-3xl bg-gradient-to-br from-[#008f18] to-[#00b320] text-white space-y-6 shadow-xl shadow-emerald-600/20">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-85">
                  Estimated Total Cost
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-1">
                  ₹{estimatedTotal}
                </div>
              </div>

              <div className="space-y-2.5 border-t border-white/20 pt-4 text-xs font-semibold opacity-90">
                <div className="flex justify-between">
                  <span>Physical Sheets Dispensed:</span>
                  <span className="font-bold">{estimatedSheets} A4 Sheets</span>
                </div>
                <div className="flex justify-between">
                  <span>Queue Wait Time:</span>
                  <span className="font-bold">0 Seconds (Instant)</span>
                </div>
                <div className="flex justify-between">
                  <span>Paper Quality:</span>
                  <span className="font-bold">80 GSM Ultra-White</span>
                </div>
              </div>

              <Link
                href="/upload"
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-[#008f18] font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>Print This Document Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. LIVE KIOSK LOCATIONS RADAR ================= */}
      <section id="kiosks" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[#008f18] text-xs font-semibold tracking-wide">
                CAMPUS COVERAGE
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#050505] tracking-tight">
                Live ATM Kiosks Network
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-normal">
                Walk up to any active terminal across campus to punch your PIN and print.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#008f18] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>100% Operational & Cloud Synced</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {machines.map((m) => (
              <div
                key={m.id}
                className="p-6 rounded-3xl bg-[#f7fcf8] border border-emerald-200/80 space-y-4 hover:border-[#00a61c] hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3" />
                      <span>{m.organizationName || 'Campus Hub'}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{m.displayName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{m.locationDescription}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase shadow-xs">
                    {m.status}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Paper Tray Level:</span>
                    <span className="text-[#008f18] font-mono">{m.currentSheetsRemaining} / {m.paperTrayCapacity || 500} Sheets</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00a61c] rounded-full"
                      style={{ width: `${Math.min(100, Math.round((m.currentSheetsRemaining / (m.paperTrayCapacity || 500)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>ID: {m.machineCode}</span>
                  <Link
                    href={`/kiosk?machine=${m.machineCode}`}
                    className="text-[#00a61c] font-bold hover:underline flex items-center gap-1 font-sans"
                  >
                    <span>Open Kiosk ATM</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. WHY CHOOSE PRINTPOINT (VS XEROX) ================= */}
      <section id="why-us" className="py-20 sm:py-28 bg-[#f0faf2] border-t border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-white border border-emerald-200/80 text-[#008f18] text-xs font-semibold tracking-wide">
              THE 2026 ADVANTAGE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#050505] tracking-tight">
              Why PrintPoint ATM Beats Traditional Xerox Shops
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal">
              Engineered specifically for busy university students, researchers, and faculty members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-7 rounded-3xl bg-white border border-emerald-200/80 space-y-3.5 shadow-xs hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#008f18] flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Zero Wait Time</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Skip 20-minute Xerox shop queues during submission deadlines. Walk up to any ATM and collect prints in 30 seconds.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-emerald-200/80 space-y-3.5 shadow-xs hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#008f18] flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">100% Privacy</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                No shopkeepers or strangers reading your confidential documents, resumes, or assignments. Memory auto-wiped instantly.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-emerald-200/80 space-y-3.5 shadow-xs hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#008f18] flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Contactless UPI</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                No exact cash change disputes. Pay via GPay, PhonePe, or Paytm with instant payment confirmation and auto-receipts.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-emerald-200/80 space-y-3.5 shadow-xs hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#008f18] flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">24/7 Hostel Access</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Need printouts at 2:00 AM before a morning exam? PrintPoint ATMs are always awake, operational, and stocked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. PARTNER WITH US / HOST A KIOSK ================= */}
      <section id="campus" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-[#008f18] via-[#00a61c] to-[#05c46b] p-8 sm:p-14 text-white shadow-2xl shadow-emerald-700/20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                <Building2 className="w-4 h-4" />
                <span>Colleges, Universities & Tech Parks</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Bring PrintPoint Cloud ATM to Your Campus
              </h2>
              <p className="text-sm sm:text-base opacity-90 leading-relaxed font-normal">
                Upgrade student infrastructure with zero upfront capex. We handle hardware deployment, cloud IoT connectivity, paper restocking, and 24/7 maintenance.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Zero Investment Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Revenue Sharing Model</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Automated Paper Telemetry</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white text-slate-900 p-7 sm:p-8 rounded-3xl shadow-xl space-y-4">
              {partnerSubmitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00a61c] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">Inquiry Received!</h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Our campus expansion team will contact you within 24 hours.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPartnerSubmitted(true);
                  }}
                  className="space-y-3.5"
                >
                  <h3 className="font-bold text-base text-slate-900">Request Kiosk Installation</h3>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Institution / College Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SRM University / IIT Madras"
                      value={partnerForm.collegeName}
                      onChange={e => setPartnerForm({ ...partnerForm, collegeName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00a61c]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={partnerForm.contactName}
                        onChange={e => setPartnerForm({ ...partnerForm, contactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00a61c]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={partnerForm.phone}
                        onChange={e => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00a61c]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#00a61c] hover:bg-[#008f18] text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    Submit Partnership Inquiry &rarr;
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 8. 2030 EXPERT-TIER FAQ ACCORDION ================= */}
      <section id="faq" className="py-20 sm:py-32 bg-[#f0faf2] border-t border-emerald-100/80 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Title with 2030 Badge */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-emerald-200/80 text-[#008f18] text-xs font-semibold shadow-2xs backdrop-blur-md">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>GOT QUESTIONS?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#050505] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal max-w-xl mx-auto">
              Everything you need to know about PrintPoint Cloud ATM.
            </p>
          </div>

          {/* Clean Glassmorphic FAQ Accordion Stack */}
          <div className="space-y-3.5">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'bg-white border-[#00a61c]/40 shadow-md shadow-emerald-600/5' 
                      : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-emerald-300 shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 group cursor-pointer"
                  >
                    <span className={`transition-colors ${isOpen ? 'text-[#008f18]' : 'group-hover:text-[#00a61c]'}`}>
                      {item.q}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isOpen ? 'bg-[#00a61c] text-white' : 'bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-[#00a61c]'
                    }`}>
                      {isOpen ? <Minus className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-100/80 animate-fade-in">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Interactive WhatsApp Helpdesk Banner */}
          <div className="p-6 rounded-2xl bg-white/80 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#008f18] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Still have questions or need assistance?</h4>
                <p className="text-xs text-slate-500">Our automated WhatsApp support desk is available 24/7.</p>
              </div>
            </div>
            <a
              href="https://wa.me/918667466390?text=Hi%20PrintPoint%20Team,%20I%20have%20a%20question"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#00a61c] hover:bg-[#008f18] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= 9. EXACT QWIKPRINT STYLE AUTHENTIC FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12 text-sm text-slate-600 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main Footer Row */}
          <div className="flex flex-col lg:flex-row justify-between gap-12">
            {/* Left Side: Brand, Tagline, Sub-callout & View Details Button */}
            <div className="space-y-6 max-w-md">
              <div className="space-y-2">
                <Logo size="md" />
                <p className="text-xs sm:text-sm text-slate-600 font-normal">
                  India's First & Only Self-Service Printing Vending kiosk
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs sm:text-sm text-slate-700 font-normal">
                  Have a Xerox shop or College Campus? Join the modern way of running a Xerox shop.
                </p>

                <a
                  href="#campus"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#00a61c] hover:bg-[#008f18] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <span>View details</span>
                  <span className="text-base font-normal leading-none">&nearr;</span>
                </a>
              </div>
            </div>

            {/* Right Side: Navigation & Social Columns */}
            <div className="grid grid-cols-2 gap-12 sm:gap-20">
              {/* Navigation Column */}
              <div className="space-y-4">
                <h4 className="text-slate-900 font-semibold text-sm sm:text-base">Navigation</h4>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-500 font-normal">
                  <li>
                    <a href="#campus" className="hover:text-slate-900 transition-colors">
                      Xerox Shops
                    </a>
                  </li>
                  <li>
                    <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="#campus" className="hover:text-slate-900 transition-colors">
                      Franchise
                    </a>
                  </li>
                  <li>
                    <a href="https://wa.me/918667466390" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <Link href="/upload" className="hover:text-slate-900 transition-colors">
                      Web Uploader
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Social Column */}
              <div className="space-y-4">
                <h4 className="text-slate-900 font-semibold text-sm sm:text-base">Social</h4>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-500 font-normal">
                  <li>
                    <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
                      Twitter (X)
                    </a>
                  </li>
                  <li>
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a href="https://google.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
                      GMB
                    </a>
                  </li>
                  <li>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
                      Linkedin
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Terms Bar */}
          <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-normal">
            <div className="flex items-center gap-4 flex-wrap text-center sm:text-left">
              <span>© 2026 PrintPoint</span>
              <span className="hidden sm:inline-block w-px h-3.5 bg-slate-300" />
              <span>PrintPoint Technologies Private Limited</span>
            </div>

            <div className="flex items-center gap-6">
              <span className="hover:text-slate-600 cursor-pointer transition-colors">
                Terms & Conditions
              </span>
              <span className="hover:text-slate-600 cursor-pointer transition-colors">
                Privacy Policy
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
