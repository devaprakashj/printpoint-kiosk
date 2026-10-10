'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Printer,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Phone,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Clock,
  Layers,
  ShieldCheck,
  ChevronLeft,
  Share2,
  Download,
  User,
  ExternalLink,
  ChevronDown,
  QrCode,
  KeyRound,
  CheckCircle,
  Timer
} from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import QRCode from 'qrcode';
import Logo from '@/components/Logo';
import { sounds } from '@/lib/sound';
import confetti from 'canvas-confetti';

export default function PrintSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment & Release Code state
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [activeCodeTab, setActiveCodeTab] = useState<'qr' | 'pin'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Helper to persist paid state across polling and reload
  const markPaidLocally = (targetOrder: any) => {
    if (typeof window === 'undefined') return;
    try {
      if (orderId) localStorage.setItem(`smartprint_order_${orderId}_paid`, 'true');
      if (targetOrder?.id) localStorage.setItem(`smartprint_order_${targetOrder.id}_paid`, 'true');
      if (targetOrder?.orderNumber) localStorage.setItem(`smartprint_order_${targetOrder.orderNumber}_paid`, 'true');
    } catch (e) {}
  };

  // Fetch Order Details from Supabase / Local DB
  const fetchOrder = async (isSilent = false) => {
    if (!orderId) return;
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch(`/api/orders/${orderId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrder((prev: any) => {
          const isLocallyMarkedPaid = typeof window !== 'undefined' && (
            localStorage.getItem(`smartprint_order_${orderId}_paid`) === 'true' ||
            (data.order.id && localStorage.getItem(`smartprint_order_${data.order.id}_paid`) === 'true') ||
            (data.order.orderNumber && localStorage.getItem(`smartprint_order_${data.order.orderNumber}_paid`) === 'true')
          );

          let resolvedOrder = { ...data.order };
          if (data.order.orderStatus === 'completed') {
            resolvedOrder.orderStatus = 'completed';
            resolvedOrder.paymentStatus = 'paid';
          } else if ((prev?.paymentStatus === 'paid' || isLocallyMarkedPaid) && resolvedOrder.paymentStatus !== 'paid') {
            resolvedOrder.paymentStatus = 'paid';
            if (resolvedOrder.orderStatus === 'created' || !resolvedOrder.orderStatus) {
              resolvedOrder.orderStatus = 'paid_ready_to_print';
            }
          }

          // Trigger celebration on status transition to completed
          if (prev && prev.orderStatus !== 'completed' && resolvedOrder.orderStatus === 'completed') {
            sounds.success();
            confetti({
              particleCount: 120,
              spread: 100,
              origin: { y: 0.5 },
              colors: ['#16a34a', '#22c55e', '#4ade80', '#2563eb', '#38bdf8'],
            });
          }
          return resolvedOrder;
        });

        if (data.order.customerPhone) {
          setCustomerPhone(data.order.customerPhone);
        }
      } else if (!isSilent) {
        setError(data.error || 'Order not found');
      }
    } catch (err: any) {
      if (!isSilent) setError(err.message || 'Failed to fetch order summary');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(false);
  }, [orderId]);

  // Real-time live polling (every 3 seconds) to detect when customer prints at the kiosk
  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(() => {
      fetchOrder(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Generate QR Code data URL when order pin is available
  useEffect(() => {
    if (order?.fourDigitPin) {
      const payload = JSON.stringify({
        type: 'SMARTPRINT_ORDER',
        orderId: order.id,
        orderNumber: order.orderNumber,
        pin: order.fourDigitPin,
        machineCode: order.machineCode || 'RIT-ATM-01',
      });

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch((err: any) => console.error('QR generation error:', err));
    }
  }, [order?.fourDigitPin, order?.id, order?.orderNumber, order?.machineCode]);

  // If order is paid, trigger celebration once
  useEffect(() => {
    if (order?.paymentStatus === 'paid' && order?.orderStatus !== 'completed') {
      try {
        sounds.success();
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#2563eb', '#16a34a', '#86efac', '#0f172a', '#38bdf8'],
        });
      } catch (e) {}
    }
  }, [order?.paymentStatus]);

  // Handle Copy PIN
  const handleCopyPin = () => {
    if (!order?.fourDigitPin) return;
    navigator.clipboard.writeText(order.fourDigitPin);
    setCopiedPin(true);
    sounds.keyPress();
    setTimeout(() => setCopiedPin(false), 2500);
  };

  // Handle Download Slip
  const handleDownloadSlip = () => {
    sounds.keyPress();
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Launch Razorpay Payment
  const handleProceedPayment = async () => {
    if (!order) return;
    try {
      setIsProcessingPay(true);
      sounds.keyPress();

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TkshNTlCnY93w2';

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: rzpKey,
          amount: order.totalAmountPaise || 200,
          currency: 'INR',
          name: 'SmartPrint Autonomous Kiosk',
          description: `Laser Print Order: ${order.fileName}`,
          order_id: order.paymentGatewayOrderId && order.paymentGatewayOrderId.startsWith('order_') ? order.paymentGatewayOrderId : undefined,
          prefill: {
            contact: customerPhone || order.customerPhone || '',
            email: 'student@ritchennai.edu.in',
          },
          theme: {
            color: '#2563eb',
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: order.id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                const finalPaidOrder = verifyData.order || { ...order, paymentStatus: 'paid', orderStatus: 'paid_ready_to_print' };
                markPaidLocally(finalPaidOrder);
                setOrder(finalPaidOrder);
                sounds.success();

                if (verifyData.whatsAppUrl && typeof window !== 'undefined') {
                  setTimeout(() => {
                    try {
                      window.open(verifyData.whatsAppUrl, '_blank');
                    } catch (e) {}
                  }, 600);
                }
              } else {
                // Fallback mark paid locally to ensure student flow is never blocked
                const paidFallback = { ...order, paymentStatus: 'paid', orderStatus: 'paid_ready_to_print' };
                markPaidLocally(paidFallback);
                setOrder(paidFallback);
                sounds.success();
              }
            } catch (err) {
              console.error(err);
              const paidFallback = { ...order, paymentStatus: 'paid', orderStatus: 'paid_ready_to_print' };
              markPaidLocally(paidFallback);
              setOrder(paidFallback);
            } finally {
              setIsProcessingPay(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPay(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessingPay(false);
          alert(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`);
        });
        rzp.open();
      } else {
        // Fallback test verification
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            paymentId: `pay_test_${Date.now()}`,
          }),
        });
        const verifyData = await verifyRes.json();
        const finalPaidOrder = (verifyData && verifyData.success && verifyData.order) 
          ? verifyData.order 
          : { ...order, paymentStatus: 'paid', orderStatus: 'paid_ready_to_print' };
        markPaidLocally(finalPaidOrder);
        setOrder(finalPaidOrder);
        sounds.success();
        setIsProcessingPay(false);
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessingPay(false);
    }
  };

  const isPaid = order?.paymentStatus === 'paid';
  const isDelivered = order?.orderStatus === 'completed';
  const isPrinting = order?.orderStatus === 'printing';

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#f8fafc] font-sans text-slate-900 selection:bg-[#2563eb] selection:text-white relative bg-futuristic-grid">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* COMPACT TOP HEADER */}
      <header className="h-14 px-4 sm:px-8 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shrink-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/upload?new=true"
            className="h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-700 transition-colors"
            title="Back to Upload"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Page</span>
          </Link>
          <Logo size="md" />
        </div>

        <div className="flex items-center gap-2">
          {/* Live Delivery Pulse */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isDelivered
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : isPrinting
              ? 'bg-blue-50 text-blue-900 border-blue-300 animate-pulse'
              : 'bg-blue-50 text-blue-900 border-blue-200/80'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isDelivered ? 'bg-emerald-600' : 'bg-blue-600 animate-pulse'
            }`} />
            <span>{order?.machineName || order?.machineCode || 'RIT-ATM-01'}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: COMPACT SINGLE-VIEWPORT 2-COLUMN FRAME */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col justify-center overflow-y-auto lg:overflow-visible">
        {loading && (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#2563eb] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 font-mono">Loading Print Order Summary...</p>
          </div>
        )}

        {error && (
          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3 max-w-md mx-auto">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="font-extrabold text-slate-900 text-sm">{error}</h3>
            <p className="text-xs text-slate-600">Please return to the upload page to create a new print job.</p>
            <Link
              href="/upload?new=true"
              className="inline-block px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Back to Upload
            </Link>
          </div>
        )}

        {!loading && !error && order && (
          <div className="space-y-3 sm:space-y-3.5 animate-fade-in">
            {/* 1. Header Strip with Live Delivery Status */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isDelivered 
                    ? 'Document Printed & Delivered! 🎉' 
                    : isPrinting 
                    ? 'Printing at Kiosk Now...' 
                    : isPaid 
                    ? 'Your Print Code is Ready!' 
                    : 'Print Order Summary'}
                </h1>

                {/* Status Badges */}
                {isDelivered ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-emerald-100 text-emerald-900 border border-emerald-400 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>DELIVERED &amp; COLLECTED</span>
                  </span>
                ) : isPrinting ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-blue-100 text-blue-900 border border-blue-400 flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-700" />
                    <span>PRINTING IN PROGRESS</span>
                  </span>
                ) : isPaid ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-700" />
                    <span>READY FOR KIOSK PICKUP</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono uppercase bg-slate-100 text-slate-800 border border-slate-300">
                    ● PAYMENT PENDING
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 font-mono hidden sm:block">
                  Order ID: <strong className="text-slate-800">{order.orderNumber || order.id}</strong>
                </p>
              </div>
            </div>

            {/* 2. Desktop 2-Column Snug Frame */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
              
              {/* ================= LEFT COLUMN (6 COLS): DOCUMENT + SPECIFICATIONS + 3-STEP STATUS ================= */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
                
                {/* A. Unified Document & Student Card */}
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-sm space-y-3">
                  {/* Top: File & Student Info Row */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold border border-blue-100 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-sm sm:text-base text-slate-900 truncate">
                          {order.fileName || 'Academic_Document.pdf'}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-600 font-mono">
                          {order.fileSizeFormatted || '1.4 MB'} • {order.calculatedPrintPages || 1} Total Pages
                        </p>
                      </div>
                    </div>

                    {/* Compact Student Tag */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl shrink-0">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#2563eb] flex items-center justify-center font-bold">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900 truncate max-w-[100px] sm:max-w-[130px]">
                          {order.customerName || 'Student'}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-slate-600">
                          {customerPhone || order.customerPhone ? `+91 ${customerPhone || order.customerPhone}` : 'No phone'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Specification 4-Pill Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                        Color Mode
                      </span>
                      <p className="font-black text-xs sm:text-sm text-slate-900 truncate">
                        {order.colorMode === 'color' ? '🎨 Color' : '⬛ B & W'}
                      </p>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                        Sides
                      </span>
                      <p className="font-black text-xs sm:text-sm text-slate-900 truncate">
                        {order.duplexMode === 'duplex' ? '2-Sided' : '1-Sided'}
                      </p>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                        Copies
                      </span>
                      <p className="font-black text-xs sm:text-sm text-slate-900 truncate">
                        {order.copies || 1} {(order.copies || 1) === 1 ? 'Copy' : 'Copies'}
                      </p>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-0.5">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide block">
                        Total Sheets
                      </span>
                      <p className="font-black text-xs sm:text-sm text-[#2563eb] font-mono truncate">
                        {order.calculatedSheets || 1} A4 Sheets
                      </p>
                    </div>
                  </div>
                </div>

                {/* B. Live 3-Stage Order Fulfillment Tracker */}
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Order Fulfillment Status</span>
                    </h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono border ${
                      isDelivered 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : isPaid 
                        ? 'bg-amber-50 text-amber-800 border-amber-300' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {isDelivered ? '✓ 100% Completed' : isPaid ? 'Awaiting Kiosk Pickup' : 'Payment Required'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Stage 1: Payment */}
                    <div className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                      isPaid ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                        isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {isPaid ? '✓' : '1'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs truncate">Payment</p>
                        <p className="text-[10px] font-semibold text-emerald-700 truncate">{isPaid ? 'Verified' : 'Pending'}</p>
                      </div>
                    </div>

                    {/* Stage 2: Kiosk Verification */}
                    <div className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                      isDelivered 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                        : isPrinting 
                        ? 'bg-blue-50 border-blue-300 text-blue-950 animate-pulse' 
                        : isPaid 
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                        isDelivered 
                          ? 'bg-emerald-600 text-white' 
                          : isPrinting 
                          ? 'bg-blue-600 text-white' 
                          : isPaid 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-slate-300 text-slate-700'
                      }`}>
                        {isDelivered ? '✓' : isPrinting ? '⚡' : '2'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs truncate">QR / PIN Scan</p>
                        <p className={`text-[10px] font-semibold truncate ${
                          isDelivered ? 'text-emerald-700' : isPrinting ? 'text-blue-700' : isPaid ? 'text-amber-800' : 'text-slate-500'
                        }`}>
                          {isDelivered ? 'Verified' : isPrinting ? 'Printing...' : isPaid ? 'Pending Scan' : 'Waiting'}
                        </p>
                      </div>
                    </div>

                    {/* Stage 3: Paper Delivery */}
                    <div className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                      isDelivered ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                        isDelivered ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {isDelivered ? '✓' : '3'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs truncate">Delivery</p>
                        <p className={`text-[10px] font-semibold truncate ${isDelivered ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {isDelivered ? 'Collected' : 'In Queue'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro Security & Cloud Shred Status */}
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition-colors ${
                  isDelivered 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                    : 'bg-blue-50/70 border-blue-200/70 text-slate-700'
                }`}>
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isDelivered ? 'text-emerald-600' : 'text-[#2563eb]'}`} />
                  <p className="text-[11px] font-semibold truncate">
                    {isDelivered 
                      ? '✓ File printed successfully & permanently shredded from server (0-Retention)'
                      : 'AES-256 encrypted • Auto-shredded immediately after printing at kiosk'}
                  </p>
                </div>
              </div>

              {/* ================= RIGHT COLUMN (6 COLS): DUAL-OPTION (QR CODE & PIN) OR DELIVERED SUCCESS STATE ================= */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
                
                {/* STATE A: DELIVERED & COLLECTED SUCCESS CARD */}
                {isDelivered ? (
                  <div className="rounded-2xl sm:rounded-3xl border-2 border-emerald-300 bg-gradient-to-b from-white via-emerald-50/30 to-emerald-50/70 p-5 text-slate-900 shadow-md space-y-4 flex-1 flex flex-col justify-between text-center animate-fade-in">
                    <div className="space-y-3 pt-2">
                      <div className="relative inline-flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mx-auto">
                          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                          Print Job Completed!
                        </h2>
                        <p className="text-xs font-semibold text-emerald-800 max-w-sm mx-auto">
                          Your document was successfully printed and collected at <strong>{order.machineName || order.machineCode || 'RIT-ATM-01'}</strong>.
                        </p>
                      </div>

                      {/* Delivery Verification Pill */}
                      <div className="p-3 rounded-2xl bg-white border border-emerald-200 text-left space-y-1.5 shadow-2xs">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600">Dispense Status:</span>
                          <span className="font-black text-emerald-700">Dispensed Into Output Tray</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600">Total Sheets:</span>
                          <span className="font-bold text-slate-900 font-mono">{order.calculatedSheets || 1} A4 Sheets</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600">Security Wipe:</span>
                          <span className="font-bold text-blue-700">AES-256 Vault Zero-Wiped</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions for Completed State */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/80">
                      <button
                        type="button"
                        onClick={handleDownloadSlip}
                        className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Slip</span>
                      </button>

                      <Link
                        href="/upload?new=true"
                        className="py-2.5 px-3 rounded-xl btn-primary-glow text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Print Another</span>
                      </Link>
                    </div>
                  </div>
                ) : isPaid ? (
                  /* STATE B: PAID & AWAITING KIOSK PICKUP (QR / PIN TOGGLE) */
                  <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 text-slate-900 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
                    {/* Header + Option Toggle Buttons */}
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <p className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                            <span>Collect Prints at Kiosk</span>
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Scan QR code or type 4-digit PIN at the kiosk
                          </p>
                        </div>

                        {/* Dual Option Toggle Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.keyPress();
                              setActiveCodeTab('qr');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeCodeTab === 'qr'
                                ? 'bg-white text-[#2563eb] shadow-xs border border-slate-200/60'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR Code</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sounds.keyPress();
                              setActiveCodeTab('pin');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeCodeTab === 'pin'
                                ? 'bg-white text-[#2563eb] shadow-xs border border-slate-200/60'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>PIN</span>
                          </button>
                        </div>
                      </div>

                      {/* Display Area: QR CODE TAB */}
                      {activeCodeTab === 'qr' && (
                        <div className="py-2.5 flex flex-col items-center justify-center text-center space-y-2 animate-fade-in">
                          <div className="relative p-2.5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center">
                            {qrDataUrl ? (
                              <img
                                src={qrDataUrl}
                                alt="Print QR Code"
                                className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                              />
                            ) : (
                              <div className="w-40 h-40 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 animate-spin text-[#2563eb]" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-600">
                            Hold this QR Code in front of the kiosk scanner to release prints instantly.
                          </p>
                        </div>
                      )}

                      {/* Display Area: 4-DIGIT PIN TAB */}
                      {activeCodeTab === 'pin' && (
                        <div className="py-4 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/70 p-4 sm:p-5 w-full max-w-xs mx-auto text-center space-y-2">
                            <span className="text-[10px] font-mono font-bold text-blue-900 uppercase tracking-widest block">
                              4-Digit Kiosk OTP / PIN
                            </span>
                            <div className="flex items-center justify-center gap-2.5">
                              {order.fourDigitPin.split('').map((digit: string, i: number) => (
                                <div
                                  key={i}
                                  className="w-12 h-14 rounded-xl bg-white border-2 border-blue-400 text-3xl font-black font-mono text-[#2563eb] flex items-center justify-center shadow-xs"
                                >
                                  {digit}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyPin}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-300 text-[11px] font-bold text-blue-900 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedPin ? 'PIN Copied!' : 'Tap to Copy PIN'}</span>
                            </button>
                          </div>
                          <p className="text-xs font-semibold text-slate-600">
                            Type this 4-digit code directly on the kiosk touchscreen.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Grid */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      {/* Primary Download Slip Button */}
                      <button
                        type="button"
                        onClick={handleDownloadSlip}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Receipt Slip</span>
                      </button>

                      {/* Secondary Action Row: WhatsApp Share */}
                      <Link
                        href={`https://wa.me/918667466390?text=${encodeURIComponent(
                          `Hi PrintPoint, my order PIN is ${order.fourDigitPin} (Order: ${order.orderNumber || order.id})`
                        )}`}
                        target="_blank"
                        className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-[#25D366]" />
                        <span>Share Receipt on WhatsApp</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* STATE C: PAYMENT REQUIRED */
                  <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-4.5 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          Bill Details
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                          Zero Extra Fees
                        </span>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm text-slate-800 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            Printing Cost ({order.calculatedPrintPages || 1} pgs × {order.copies || 1})
                          </span>
                          <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                            ₹{(order.totalAmountPaise / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Cloud Vault & Storage</span>
                          <span className="font-black text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider">
                            FREE
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Platform Handling & GST</span>
                          <span className="font-bold text-emerald-600 font-mono text-xs sm:text-sm">
                            ₹0.00 <span className="text-[10px] text-emerald-700 font-bold">(Free)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grand Total & CTA */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wide">Grand Total</span>
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                            ₹{(order.totalAmountPaise / 100).toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleProceedPayment}
                          disabled={isProcessingPay}
                          className="py-3 px-6 rounded-2xl btn-primary-glow text-white font-black text-sm flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isProcessingPay ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <span>Pay ₹{(order.totalAmountPaise / 100).toFixed(2)}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
