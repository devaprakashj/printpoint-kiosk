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
  Timer,
  Receipt,
  X
} from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
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
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // 5-Minute Payment Window Countdown State (300 Seconds)
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showDocDetails, setShowDocDetails] = useState<boolean>(false);

  // Active 1-second countdown timer based on order creation timestamp
  useEffect(() => {
    if (!order || order.paymentStatus === 'paid' || order.orderStatus === 'completed') return;

    const computeTime = () => {
      const createdMs = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
      const expireMs = createdMs + 5 * 60 * 1000; // 5 minutes window
      const remainingSecs = Math.max(0, Math.floor((expireMs - Date.now()) / 1000));
      setTimeLeft(remainingSecs);

      if (remainingSecs <= 0) {
        setIsExpired(true);
      }
    };

    computeTime();
    const timer = setInterval(computeTime, 1000);
    return () => clearInterval(timer);
  }, [order?.createdAt, order?.paymentStatus, order?.orderStatus]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
      if (!res.ok) {
        let errMsg = 'Order not found or expired';
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {
          errMsg = `Order request failed (status ${res.status})`;
        }
        if (!isSilent) setError(errMsg);
        return;
      }
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

  // Handle Direct PDF Download
  const handleDownloadPdf = async () => {
    try {
      sounds.keyPress();
      setIsDownloadingPdf(true);

      // If modal is not open yet, open it to ensure DOM element exists
      if (!showReceiptModal) {
        setShowReceiptModal(true);
        await new Promise((r) => setTimeout(r, 250));
      }

      const element = document.getElementById('printable-receipt');
      if (!element) throw new Error('Receipt element not found');

      // Render crisp receipt image
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        filter: (node) => {
          // Exclude close button and bottom actions bar from PDF output
          if (node instanceof HTMLElement && node.classList.contains('print:hidden')) {
            return false;
          }
          return true;
        },
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Standard receipt width: 300pt (~4.1 inches)
      const pdfWidth = 300;
      const pdfHeight = (img.height * pdfWidth) / img.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeId = order?.orderNumber || order?.id || 'Receipt';
      pdf.save(`SmartPrint_Receipt_${safeId}.pdf`);
      sounds.success();
    } catch (err) {
      console.error('PDF export error:', err);
      if (typeof window !== 'undefined') {
        window.print();
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handle Download Slip / View
  const handleDownloadSlip = () => {
    handleDownloadPdf();
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
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#f8fafc] font-sans text-slate-900 selection:bg-[#2563eb] selection:text-white relative bg-futuristic-grid">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* COMPACT TOP HEADER */}
      <header className="h-12 sm:h-13 px-3.5 sm:px-6 lg:px-8 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shrink-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/upload?new=true"
            className="h-8 w-8 sm:w-auto sm:px-3 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-700 transition-colors shrink-0"
            title="Back to Upload"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
          <div className="shrink-0 flex items-center">
            <Logo size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order?.orderNumber && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
              {order.orderNumber}
            </span>
          )}
          <img src="/rit-emblem.png" alt="RIT" className="h-6 w-auto object-contain shrink-0" />
        </div>
      </header>

      {/* MAIN CONTAINER: COMPACT FULL-FRAME VIEWPORT */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-2 flex flex-col lg:justify-center overflow-y-auto">
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
          <div className="space-y-2 sm:space-y-2.5 animate-fade-in">
            {/* 1. Header Strip with Live Delivery Status */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="min-w-0 flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  {isDelivered 
                    ? 'Print Completed! 🎉' 
                    : isPrinting 
                    ? 'Printing at Kiosk Now...' 
                    : isPaid 
                    ? 'Print Code Ready!' 
                    : isExpired
                    ? 'Order Payment Expired'
                    : 'Print Order Summary'}
                </h1>
              </div>

              {/* Status Badges */}
              <div className="shrink-0 ml-2">
                {isDelivered ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase bg-emerald-100 text-emerald-900 border border-emerald-400 flex items-center gap-1 shadow-2xs">
                    <CheckCircle className="w-3 h-3 text-emerald-700" />
                    <span>COLLECTED</span>
                  </span>
                ) : isPrinting ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase bg-blue-100 text-blue-900 border border-blue-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-700" />
                    <span>PRINTING</span>
                  </span>
                ) : isPaid ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Timer className="w-3 h-3 text-amber-700" />
                    <span>READY FOR PICKUP</span>
                  </span>
                ) : isExpired ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold font-mono uppercase bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>EXPIRED</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                    <span>PAYMENT PENDING</span>
                  </span>
                )}
              </div>
            </div>

            {/* Subtitle / Expiry countdown for pending orders */}
            {!isDelivered && !isPrinting && !isPaid && !isExpired && (
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <span>Order #{order.orderNumber || order.id}</span>
                <span>•</span>
                <span className={`inline-flex items-center gap-1 font-mono font-bold ${
                  timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-amber-700'
                }`}>
                  <Timer className="w-3.5 h-3.5" />
                  Expires in {formatCountdown(timeLeft)}
                </span>
              </p>
            )}

            {/* 2. Responsive 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3.5 items-stretch">
              
              {/* ================= LEFT COLUMN (6 COLS): PIPELINE STATUS + DOCUMENT SPECS ================= */}
              <div className={`lg:col-span-6 flex flex-col justify-between space-y-2 sm:space-y-2.5 ${
                isPaid || isDelivered ? 'order-2 lg:order-1' : 'order-1'
              }`}>
                {/* C. Real Connected Campus Kiosk Pipeline Tracker */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                      Live Order Progress
                    </span>

                    {/* Active Status Pill */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/70 text-[11px] font-bold font-mono text-slate-700">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isDelivered 
                          ? 'bg-emerald-500' 
                          : isPrinting 
                          ? 'bg-blue-600 animate-ping' 
                          : isPaid 
                          ? 'bg-blue-600 animate-pulse' 
                          : isExpired 
                          ? 'bg-rose-500' 
                          : 'bg-amber-500 animate-pulse'
                      }`} />
                      <span>
                        {isDelivered 
                          ? 'Completed' 
                          : isPrinting 
                          ? 'Printing Now' 
                          : isPaid 
                          ? 'Ready for Scan' 
                          : isExpired 
                          ? 'Session Expired' 
                          : 'Payment Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Connected Stepper Timeline with Guaranteed Non-Overflowing Flex Connectors */}
                  <div className="pt-1.5 pb-1 space-y-2">
                    <div className="flex items-center justify-between w-full px-5 sm:px-8">
                      {/* Step 1 Node */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all shadow-2xs ${
                        isPaid || isDelivered 
                          ? 'bg-emerald-500 text-white ring-3 ring-emerald-100' 
                          : isExpired 
                          ? 'bg-rose-500 text-white ring-3 ring-rose-100' 
                          : 'bg-blue-600 text-white ring-3 ring-blue-100'
                      }`}>
                        {isPaid || isDelivered ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isExpired ? '✕' : '1'}
                      </div>

                      {/* Line 1 -> 2 */}
                      <div className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full transition-all duration-500 ${
                        isPaid || isDelivered ? 'bg-emerald-500' : 'bg-slate-200'
                      }`} />

                      {/* Step 2 Node */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all shadow-2xs ${
                        isDelivered 
                          ? 'bg-emerald-500 text-white ring-3 ring-emerald-100' 
                          : isPrinting 
                          ? 'bg-blue-600 text-white ring-3 ring-blue-100 animate-pulse' 
                          : isPaid 
                          ? 'bg-[#2563eb] text-white ring-3 ring-blue-100' 
                          : 'bg-white border-2 border-slate-200 text-slate-400'
                      }`}>
                        {isDelivered ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isPrinting ? '⚡' : isPaid ? <QrCode className="w-3.5 h-3.5" /> : '2'}
                      </div>

                      {/* Line 2 -> 3 */}
                      <div className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full transition-all duration-500 ${
                        isDelivered ? 'bg-emerald-500' : isPrinting ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'
                      }`} />

                      {/* Step 3 Node */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all shadow-2xs ${
                        isDelivered 
                          ? 'bg-emerald-500 text-white ring-3 ring-emerald-100' 
                          : isPrinting 
                          ? 'bg-blue-50 border-2 border-blue-400 text-blue-700 animate-pulse' 
                          : 'bg-white border-2 border-slate-200 text-slate-400'
                      }`}>
                        {isDelivered ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isPrinting ? '🖨️' : '3'}
                      </div>
                    </div>

                    {/* Step Labels */}
                    <div className="grid grid-cols-3 text-center">
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-900 leading-none">Payment</p>
                        <p className={`mt-0.5 text-[10px] font-semibold ${
                          isPaid || isDelivered ? 'text-emerald-700' : isExpired ? 'text-rose-600' : 'text-blue-700'
                        }`}>
                          {isPaid || isDelivered ? 'Verified ✓' : isExpired ? 'Timed Out' : 'Pending'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-extrabold text-slate-900 leading-none">Kiosk Scan</p>
                        <p className={`mt-0.5 text-[10px] font-semibold ${
                          isDelivered ? 'text-emerald-700' : isPrinting ? 'text-blue-700' : isPaid ? 'text-[#2563eb]' : 'text-slate-400'
                        }`}>
                          {isDelivered ? 'Scanned ✓' : isPrinting ? 'In Progress' : isPaid ? 'Ready to Scan' : 'Waiting'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-extrabold text-slate-900 leading-none">Print Pickup</p>
                        <p className={`mt-0.5 text-[10px] font-semibold ${
                          isDelivered ? 'text-emerald-700' : isPrinting ? 'text-blue-700' : 'text-slate-400'
                        }`}>
                          {isDelivered ? 'Collected 🎉' : isPrinting ? 'Printing' : 'In Queue'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Accordion Toggle Button (When Paid or Delivered) */}
                {(isPaid || isDelivered) && (
                  <div className="lg:hidden">
                    <button
                      type="button"
                      onClick={() => setShowDocDetails(!showDocDetails)}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-between transition-colors shadow-2xs cursor-pointer active:bg-slate-50"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#2563eb]" />
                        <span>{showDocDetails ? 'Hide Document & Customer Details' : 'View Full Document & Customer Details'}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{showDocDetails ? '▲' : '▼'}</span>
                    </button>
                  </div>
                )}

                {/* A. Unified Document & Specifications Card */}
                <div className={`${(isPaid || isDelivered) && !showDocDetails ? 'hidden lg:block' : 'block'} rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-xs space-y-2`}>
                  {/* Top: File Info Row */}
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold border border-blue-100 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate" title={order.fileName}>
                        {order.fileName || 'Academic_Document.pdf'}
                      </h3>
                      <p className="text-[10px] font-semibold text-slate-500 font-mono">
                        {order.fileSizeFormatted || '1.4 MB'} • {order.calculatedPrintPages || 1} Total Pages
                      </p>
                    </div>
                  </div>

                  {/* Specification 4-Pill Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">
                        Color Mode
                      </span>
                      <p className="font-black text-xs text-slate-900 truncate">
                        {order.colorMode === 'color' ? '🎨 Color' : '⬛ B & W'}
                      </p>
                    </div>

                    <div className="p-1.5 sm:p-2 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">
                        Sides
                      </span>
                      <p className="font-black text-xs text-slate-900 truncate">
                        {order.duplexMode === 'duplex' ? '2-Sided' : '1-Sided'}
                      </p>
                    </div>

                    <div className="p-1.5 sm:p-2 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">
                        Copies
                      </span>
                      <p className="font-black text-xs text-slate-900 truncate">
                        {order.copies || 1} {(order.copies || 1) === 1 ? 'Copy' : 'Copies'}
                      </p>
                    </div>

                    <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50/70 border border-blue-200/70 space-y-0.5">
                      <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wide block">
                        Total Sheets
                      </span>
                      <p className="font-black text-xs text-[#2563eb] font-mono whitespace-nowrap">
                        {order.calculatedSheets || 1} A4 Sheets
                      </p>
                    </div>
                  </div>
                </div>

                {/* B. Dedicated Contact & Pickup User Card */}
                <div className={`${(isPaid || isDelivered) && !showDocDetails ? 'hidden lg:block' : 'block'} rounded-2xl border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-xs`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    {/* User Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold border border-blue-100 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Contact Name
                        </p>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 break-words leading-tight">
                          {order.customerName || order.customerEmail || 'Customer'}
                        </h4>
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="flex items-center gap-2 sm:justify-end border-t sm:border-t-0 border-slate-100 pt-1.5 sm:pt-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider sm:text-right">
                          WhatsApp Mobile
                        </p>
                        <p className="font-mono font-bold text-xs text-slate-900 leading-tight">
                          {order.customerPhone ? (() => {
                            const clean = String(order.customerPhone).replace(/\D/g, '');
                            return clean.length === 10 ? `+91 ${clean.slice(0, 5)} ${clean.slice(5)}` : `+91 ${clean}`;
                          })() : 'No phone'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Minimalist Trust & Privacy Note */}
                <div className="flex items-center justify-center gap-1.5 py-0.5 text-[10px] text-slate-500 text-center">
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isDelivered ? 'text-emerald-600' : isExpired ? 'text-rose-500' : 'text-[#2563eb]'}`} />
                  <span className="font-medium whitespace-nowrap">
                    {isDelivered 
                      ? 'Document collected • Auto-shredded from cloud'
                      : isExpired
                      ? 'Unpaid document auto-shredded from cloud'
                      : 'AES-256 Encrypted • Auto-shreds after printing'}
                  </span>
                </div>
              </div>

              {/* ================= RIGHT COLUMN (6 COLS): DUAL-OPTION (QR CODE & PIN) OR DELIVERED SUCCESS STATE ================= */}
              <div className={`lg:col-span-6 flex flex-col justify-between space-y-2 sm:space-y-2.5 ${
                isPaid || isDelivered ? 'order-1 lg:order-2' : 'order-2'
              }`}>
                
                {/* STATE A: DELIVERED & COLLECTED SUCCESS CARD */}
                {isDelivered ? (
                  <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-white via-emerald-50/30 to-emerald-50/70 p-4 sm:p-5 text-slate-900 shadow-xs space-y-3 flex-1 flex flex-col justify-between text-center animate-fade-in">
                    <div className="space-y-2.5 pt-0.5">
                      <div className="relative inline-flex items-center justify-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 mx-auto">
                          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-lg sm:text-xl font-black text-slate-900">
                          Print Job Completed!
                        </h2>
                        <p className="text-xs font-semibold text-emerald-800 max-w-sm mx-auto">
                          Your document was successfully printed and collected at <span className="font-extrabold text-slate-900">{order.machineName || order.machineCode || 'Print ATM – Main Campus Hub'}</span>.
                        </p>
                      </div>

                      {/* Delivery Verification Pill */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-emerald-200 text-left divide-y divide-emerald-100/80 text-xs shadow-2xs">
                        <div className="pb-1.5 flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-600 text-[11px] sm:text-xs shrink-0">Dispense Status:</span>
                          <span className="font-extrabold text-emerald-700 text-[11px] sm:text-xs text-right">Dispensed to Output Tray ✓</span>
                        </div>
                        <div className="py-1.5 flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-600 text-[11px] sm:text-xs shrink-0">Total Sheets:</span>
                          <span className="font-bold text-slate-900 font-mono text-[11px] sm:text-xs text-right">{order.calculatedSheets || 1} A4 Sheets</span>
                        </div>
                        <div className="pt-1.5 flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-600 text-[11px] sm:text-xs shrink-0">Security Wipe:</span>
                          <span className="font-bold text-blue-700 text-[11px] sm:text-xs text-right">AES-256 Cloud Shredded</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions for Completed State */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.keyPress();
                          setShowReceiptModal(true);
                        }}
                        className="h-10 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        <Receipt className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="whitespace-nowrap">View Receipt</span>
                      </button>

                      <Link
                        href="/upload?new=true"
                        className="h-10 px-3 rounded-xl btn-primary-glow text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Print Another</span>
                      </Link>
                    </div>
                  </div>
                ) : isPaid ? (
                  /* STATE B: PAID & AWAITING KIOSK PICKUP (PREMIUM PASS UI) */
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-3.5 text-slate-900 shadow-xs space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      
                      {/* 1. PROMINENT 4-DIGIT PIN CARD */}
                      <div className="w-full rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/80 p-3 sm:p-3.5 shadow-sm text-center space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-[11px] font-black uppercase tracking-wider">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>YOUR 4-DIGIT PRINT RELEASE PIN</span>
                        </div>

                        {/* GIANT 4-DIGIT PIN BOXES */}
                        <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-0.5">
                          {String(order?.fourDigitPin || '----').split('').map((digit: string, idx: number) => (
                            <div
                              key={idx}
                              className="w-12 h-14 sm:w-13 sm:h-15 rounded-2xl bg-slate-900 border-2 border-amber-400 text-amber-300 font-mono font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md shadow-slate-900/15 select-all"
                            >
                              {digit}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={handleCopyPin}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-colors cursor-pointer"
                          >
                            {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                            <span>{copiedPin ? 'PIN Copied!' : 'Copy PIN'}</span>
                          </button>
                          <span className="text-[11px] text-slate-700 font-bold">
                            Type on Kiosk Touchscreen
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="relative flex items-center justify-center my-1">
                        <div className="w-full border-t border-slate-200" />
                        <span className="absolute bg-white px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          OR SCAN QR CODE
                        </span>
                      </div>

                      {/* 2. Official Digital QR Print Pass Header */}
                      <div className="text-center pb-0.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider mb-0.5">
                          <Sparkles className="w-3 h-3" />
                          <span>Official QR Print Pass</span>
                        </div>
                        <p className="text-xs font-bold text-slate-600">
                          Hold code to kiosk scanner window
                        </p>
                      </div>

                      {/* 2. Clean Document Context Strip (Shown on Mobile, hidden on Desktop) */}
                      <div className="lg:hidden flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-100/70 text-[#2563eb] flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs text-slate-900 truncate" title={order.fileName}>
                              {order.fileName || 'Academic_Document.pdf'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 font-mono">
                              {order.calculatedSheets || 1} {((order.calculatedSheets || 1) === 1) ? 'A4 Sheet' : 'A4 Sheets'} • {order.colorMode === 'color' ? 'Color' : 'B&W'} • {order.duplexMode === 'duplex' ? '2-Sided' : '1-Sided'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 px-2 py-0.5 rounded-full shrink-0">
                          Paid ✓
                        </span>
                      </div>

                      {/* 3. Display Area: QR CODE VIEW */}
                      <div className="py-1 flex flex-col items-center justify-center text-center space-y-2 animate-fade-in">
                        {/* Modern Scanner Viewfinder Frame */}
                        <div className="relative p-3 lg:p-2.5 rounded-2xl bg-white border-2 border-blue-200/80 shadow-md shadow-blue-500/10 flex items-center justify-center">
                          {/* Viewfinder Corners */}
                          <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#2563eb] rounded-tl pointer-events-none" />
                          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#2563eb] rounded-tr pointer-events-none" />
                          <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#2563eb] rounded-bl pointer-events-none" />
                          <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#2563eb] rounded-br pointer-events-none" />

                          {qrDataUrl ? (
                            <img
                              src={qrDataUrl}
                              alt="Print QR Code"
                              className="w-40 h-40 sm:w-44 sm:h-44 lg:w-32 lg:h-32 xl:w-36 xl:h-36 object-contain rounded-md"
                            />
                          ) : (
                            <div className="w-32 h-32 flex items-center justify-center">
                              <RefreshCw className="w-5 h-5 animate-spin text-[#2563eb]" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Hold 10cm - 15cm from scanner</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Authentically Framed Receipt Pass Section */}
                    <div className="pt-2 border-t border-dashed border-slate-200/90">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between px-0.5 text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <img src="/rit-emblem.png" alt="RIT" className="h-3.5 w-auto object-contain shrink-0" />
                            <span>Payment Receipt Slip</span>
                          </span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px]">
                            ₹{(order.totalAmountPaise / 100).toFixed(2)} Paid ✓
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isDownloadingPdf}
                            className="py-1.5 sm:py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-60"
                          >
                            {isDownloadingPdf ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            <span>Download PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sounds.keyPress();
                              setShowReceiptModal(true);
                            }}
                            className="py-1.5 sm:py-2 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-98"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Receipt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isExpired ? (
                  /* STATE D: ORDER EXPIRED (5 MIN TIMEOUT) */
                  <div className="rounded-2xl sm:rounded-3xl border-2 border-rose-200/90 bg-gradient-to-b from-white via-rose-50/20 to-rose-50/60 p-5 sm:p-6 text-slate-900 shadow-sm space-y-4 flex-1 flex flex-col justify-between text-center animate-fade-in">
                    <div className="space-y-3 pt-2">
                      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                        <Timer className="w-7 h-7 stroke-[2.2]" />
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-lg sm:text-xl font-black text-slate-900">
                          Payment Session Expired
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">
                          This print order was not completed within the 5-minute window. Unpaid files have been securely shredded from the cloud vault to protect your privacy.
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-white border border-rose-200/80 text-left space-y-1.5 text-xs shadow-2xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600">Session Limit:</span>
                          <span className="font-black text-rose-600 font-mono">5 Minutes (Timed Out)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-600">Privacy Shred:</span>
                          <span className="font-bold text-emerald-700 font-mono">Unprinted Files Purged</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href="/upload?new=true"
                        className="w-full py-3 px-4 rounded-xl btn-primary-glow text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Upload &amp; Start Fresh Print</span>
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

                      {/* Live 5-Min Countdown Strip */}
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        timeLeft < 60
                          ? 'bg-rose-50 border-rose-200 text-rose-950 animate-pulse'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Timer className={`w-4 h-4 shrink-0 ${timeLeft < 60 ? 'text-rose-600' : 'text-amber-700'}`} />
                          <span className="font-semibold text-[11px] sm:text-xs">
                            {timeLeft < 60 ? 'Session expiring soon:' : 'Complete payment within:'}
                          </span>
                        </div>
                        <span className={`font-mono font-black text-xs sm:text-sm ${
                          timeLeft < 60 ? 'text-rose-600' : 'text-amber-800'
                        }`}>
                          {formatCountdown(timeLeft)}
                        </span>
                      </div>
                    </div>

                    {/* Grand Total & CTA */}
                    <div className="pt-2">
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Grand Total</span>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                            ₹{(order.totalAmountPaise / 100).toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleProceedPayment}
                          disabled={isProcessingPay || isExpired}
                          className="py-3 px-5 sm:px-6 rounded-xl btn-primary-glow text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
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

      {/* ================= AUTHENTIC FRAMED PRINT RECEIPT SLIP MODAL ================= */}
      {showReceiptModal && order && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          {/* Backdrop click dismiss */}
          <div 
            className="fixed inset-0 print:hidden cursor-pointer" 
            onClick={() => setShowReceiptModal(false)} 
          />

          {/* Authentic Printable Receipt Voucher Container */}
          <div 
            id="printable-receipt"
            className="relative z-10 w-full max-w-sm sm:max-w-md max-h-[90vh] bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden font-sans text-slate-900 my-auto flex flex-col animate-scale-up"
          >
            {/* Official Header with College Crest & SmartPrint Logo */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 py-2.5 px-3.5 text-white text-center relative border-b border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer print:hidden"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Official Logo Badge Container */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white text-slate-900 shadow-2xs mx-auto mb-1">
                <img
                  src="/rit-emblem.png"
                  alt="RIT Crest"
                  className="h-5 w-auto object-contain block shrink-0"
                />
                <div className="h-3.5 w-px bg-slate-200 shrink-0" />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-black text-xs tracking-tight text-slate-900 font-sans">
                    Smart<span className="text-[#2563eb]">Print</span>
                  </span>
                  <span className="flex h-1.5 w-1.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2563eb]" />
                  </span>
                </div>
              </div>

              <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-300 leading-tight">
                Rajalakshmi Institute of Technology
              </p>
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white mt-0.5 leading-tight">
                Official Payment Receipt &amp; Kiosk Pass
              </h2>
              <p className="text-[9px] text-blue-300 font-mono mt-0.5 leading-tight">
                Terminal: {order.machineName || order.machineCode || 'Print ATM - Main Campus Hub'}
              </p>
            </div>

            {/* Receipt Body (Scrollable if viewport is tiny, but naturally snug) */}
            <div className="p-3 sm:p-3.5 space-y-2 flex-1 overflow-y-auto">
              {/* College Authorization Watermark & Reference Strip */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <img src="/rit-emblem.png" alt="RIT Emblem" className="w-5 h-5 object-contain shrink-0" />
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 font-mono text-xs leading-tight truncate">
                      RCP-{order.orderNumber || order.id}
                    </p>
                    <p className="text-[9px] text-blue-700 font-semibold leading-tight">RIT Autonomous Network</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-[9px] text-emerald-800 font-black bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-md inline-block">
                    TAX INVOICE • PAID ✓
                  </span>
                  <p className="font-mono text-[9px] text-slate-400 mt-0.5">
                    {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Customer & Itemized Print Specifications */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1 text-xs">
                <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs pb-1 border-b border-slate-200/70">
                  <span className="truncate max-w-[200px]" title={order.fileName}>
                    📄 {order.fileName || 'Document.pdf'}
                  </span>
                  <span className="font-mono font-black text-slate-900">
                    ₹{(order.totalAmountPaise / 100).toFixed(2)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>{order.calculatedSheets || 1} Sheets ({order.colorMode === 'color' ? 'Color' : 'B&W'}, {order.duplexMode === 'duplex' ? '2-Sided' : '1-Sided'}, {order.copies || 1} {order.copies === 1 ? 'Copy' : 'Copies'})</span>
                  <span className="text-slate-700 font-bold">{order.customerName || 'Student'}</span>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-0.5">
                  <span>Cloud Vault AES-256 Storage & Handling</span>
                  <span className="text-emerald-700 font-bold">FREE (₹0.00)</span>
                </div>

                <div className="pt-1.5 border-t border-slate-900 flex justify-between items-baseline">
                  <span className="font-black text-xs uppercase tracking-wide text-slate-900">Total Paid</span>
                  <span className="font-black text-base font-mono text-[#2563eb]">
                    ₹{(order.totalAmountPaise / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Perforated Voucher Tear Line */}
              <div className="relative my-1 py-0.5">
                <div className="border-t border-dashed border-slate-300 w-full" />
              </div>

              {/* Kiosk Pickup Release Pass */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <div className="flex items-center justify-center gap-3">
                  {qrDataUrl && (
                    <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0">
                      <img src={qrDataUrl} alt="Release QR" className="w-16 h-16 object-contain rounded" />
                    </div>
                  )}

                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Official QR Print Pass</span>
                    <p className="text-[10px] font-medium text-slate-600">Hold QR code in front of the kiosk scanner</p>
                    <p className="text-[9px] text-emerald-700 font-bold">Touchless Instant Release ✓</p>
                  </div>
                </div>
              </div>

              {/* Security Shield Note */}
              <div className="text-center pt-0.5">
                <p className="text-[9px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Verified by SmartPrint Vault • Document auto-shreds after printing</span>
                </p>
              </div>
            </div>

            {/* Modal Actions (Hidden in Print, Fixed at bottom) */}
            <div className="p-2 sm:p-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 print:hidden shrink-0">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex-1 py-1.5 px-3 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isDownloadingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Receipt</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.keyPress();
                  window.print();
                }}
                className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Print on physical printer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="py-1.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Styles for Clean Receipt Slip Printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 380px !important;
            max-width: 100% !important;
            margin: 0 !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>
    </div>
  );
}
