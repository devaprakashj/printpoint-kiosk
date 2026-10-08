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
} from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
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

  // Payment state
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');

  // Fetch Order Details from Supabase
  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        if (data.order.customerPhone) {
          setCustomerPhone(data.order.customerPhone);
        }
      } else {
        setError(data.error || 'Order not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // If order is already paid, celebrate
  useEffect(() => {
    if (order?.paymentStatus === 'paid') {
      try {
        sounds.success();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#00a61c', '#16a34a', '#86efac', '#0f172a', '#38bdf8'],
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
          name: 'PrintPoint Autonomous ATM',
          description: `Laser Print Order: ${order.fileName}`,
          order_id: order.paymentGatewayOrderId && order.paymentGatewayOrderId.startsWith('order_') ? order.paymentGatewayOrderId : undefined,
          prefill: {
            contact: customerPhone || order.customerPhone || '918667466390',
            email: 'customer@printpoint.in',
          },
          theme: {
            color: '#00a61c',
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
                setOrder(verifyData.order || { ...order, paymentStatus: 'paid' });
                sounds.success();

                if (verifyData.whatsAppUrl && typeof window !== 'undefined') {
                  setTimeout(() => {
                    try {
                      window.open(verifyData.whatsAppUrl, '_blank');
                    } catch (e) {}
                  }, 600);
                }
              } else {
                alert(`Payment Verification Notice: ${verifyData.error || 'Could not verify payment'}`);
              }
            } catch (err) {
              console.error(err);
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
        if (verifyData.success) {
          setOrder(verifyData.order || { ...order, paymentStatus: 'paid' });
          sounds.success();
        }
        setIsProcessingPay(false);
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessingPay(false);
    }
  };

  const isPaid = order?.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-mint-grid font-sans text-slate-900 pb-20 selection:bg-emerald-500 selection:text-white">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* TOP HEADER */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Back to Upload"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <Logo size="md" />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="hidden sm:inline">{order?.machineCode || 'RIT-ATM-01'}</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {loading && (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00a61c] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 font-mono">Loading Print Order Summary...</p>
          </div>
        )}

        {error && (
          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="font-extrabold text-slate-900 text-sm">{error}</h3>
            <p className="text-xs text-slate-500">Please return to the upload page and configure a fresh print job.</p>
            <Link
              href="/upload"
              className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Back to Upload
            </Link>
          </div>
        )}

        {!loading && !error && order && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 1. REVIEW / SUMMARY BANNER */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#00a61c]" />
                <span>{isPaid ? 'Order Verified & Ready for Print' : 'Review Your Order'}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {isPaid ? 'Printing PIN Activated! 🎉' : 'Print Order Summary'}
              </h1>
              <p className="text-xs text-slate-500 font-mono">Order ID: {order.orderNumber || order.id}</p>
            </div>

            {/* 2. SUCCESS PIN CARD (IF PAID) */}
            {isPaid && (
              <div className="bg-gradient-to-b from-[#003814] to-[#041a0d] border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 text-white text-center space-y-6 shadow-2xl shadow-emerald-950/40 relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    Kiosk Dispensing Master Code
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-white drop-shadow-md">
                      {order.fourDigitPin}
                    </span>
                    <button
                      onClick={handleCopyPin}
                      className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                      title="Copy PIN"
                    >
                      {copiedPin ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  {copiedPin && <p className="text-xs text-emerald-300 font-bold font-mono">Copied to clipboard!</p>}
                </div>

                {/* 3 Step Instruction */}
                <div className="grid grid-cols-3 gap-2 text-left bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px]">
                  <div className="space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                    <p className="font-bold text-white">Walk to Kiosk</p>
                    <p className="text-slate-400 text-[10px]">{order.machineName || order.machineCode}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                    <p className="font-bold text-white">Enter 4-Digit PIN</p>
                    <p className="text-slate-400 text-[10px]">Type <b>{order.fourDigitPin}</b></p>
                  </div>
                  <div className="space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                    <p className="font-bold text-white">Collect Prints</p>
                    <p className="text-slate-400 text-[10px]">Instant laser output</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`https://wa.me/918667466390?text=Hi%20PrintPoint,%20my%20order%20PIN%20is%20${order.fourDigitPin}%20(Order:%20${order.orderNumber})`}
                    target="_blank"
                    className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <span>Send WhatsApp Receipt</span>
                  </Link>

                  <Link
                    href={`/kiosk?machine=${order.machineCode || 'RIT-ATM-01'}`}
                    target="_blank"
                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Open ATM Screen</span>
                  </Link>
                </div>
              </div>
            )}

            {/* 3. ORDER SPECS CARD */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00a61c] flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 truncate max-w-xs">{order.fileName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{order.fileSizeFormatted || '1.2 MB'}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                  isPaid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  ● {isPaid ? 'PAID & READY' : 'PAYMENT PENDING'}
                </span>
              </div>

              {/* Spec Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold">COLOR MODE</span>
                  <span className="font-extrabold text-slate-800 uppercase">{order.colorMode === 'color' ? '🎨 Full Color' : '⬛ Black & White'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold">PRINT SIDES</span>
                  <span className="font-extrabold text-slate-800 uppercase">{order.duplexMode === 'duplex' ? '📄 2-Sided (Duplex)' : '📄 1-Sided'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold">COPIES</span>
                  <span className="font-extrabold text-slate-800">{order.copies || 1} Set(s)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold">TOTAL SHEETS</span>
                  <span className="font-extrabold text-[#00a61c]">{order.calculatedSheets || 1} Sheets</span>
                </div>
              </div>
            </div>

            {/* 4. BILL DETAILS & PRICING BREAKDOWN */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                <span>Payment & Bill Breakdown</span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">100% Tax Compliant</span>
              </h3>

              <div className="space-y-2.5 text-xs font-mono text-slate-600 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <span>Printing Charges ({order.calculatedPrintPages || 1} pgs × {order.copies || 1} copies)</span>
                  <span className="font-bold text-slate-900">₹{(order.totalAmountPaise / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Cloud Encryption & Storage Vault</span>
                  <span className="font-bold uppercase">FREE</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>GST / Platform Fee</span>
                  <span>₹0.00</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-500 font-bold block">Grand Total</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    ₹{(order.totalAmountPaise / 100).toFixed(2)}
                  </span>
                </div>

                {!isPaid && (
                  <button
                    onClick={handleProceedPayment}
                    disabled={isProcessingPay}
                    className="py-3 px-6 rounded-2xl bg-[#00a61c] hover:bg-[#008f18] text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isProcessingPay ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ₹{(order.totalAmountPaise / 100).toFixed(2)} Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 5. PRIVACY & SHREDDING NOTICE */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#00a61c]" />
                <span>Zero-Retention Cryptographic Privacy</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Your uploaded files are encrypted with AES-256 and will be permanently shredded from the cloud server immediately after printing at the kiosk.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
