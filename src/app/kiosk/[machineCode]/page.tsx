'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Printer,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileText,
  Volume2,
  VolumeX,
  Smartphone,
  ScanLine,
  HelpCircle,
  X,
  Check,
  CheckCircle,
  Radio,
  XCircle,
} from 'lucide-react';

// Streamlined Autonomous Kiosk Navigation Screens
type KioskScreen = 
  | 'ready_to_scan' 
  | 'order_details' 
  | 'printing' 
  | 'print_complete' 
  | 'collect_documents';

export default function AutonomousTouchscreenKiosk() {
  const params = useParams();
  const machineCode = ((params?.machineCode as string) || 'RIT-ATM-01').toUpperCase();

  // Current Active Screen State - Default is permanent "Ready to Scan" mode!
  const [currentScreen, setCurrentScreen] = useState<KioskScreen>('ready_to_scan');

  // Kiosk Hardware Telemetry
  const [machineData, setMachineData] = useState<any>(null);
  const [isMachineOnline, setIsMachineOnline] = useState<boolean>(true);

  // Active Order State
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isVerifyingOrder, setIsVerifyingOrder] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Auto-Print Countdown on Order Details Screen
  const [autoPrintCountdown, setAutoPrintCountdown] = useState<number>(3);
  const autoPrintTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Printing Progress State
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [printStep, setPrintStep] = useState<number>(1); // 1: Preparing, 2: Printing, 3: Finishing, 4: Complete

  // Collection countdown
  const [countdownSeconds, setCountdownSeconds] = useState<number>(8);

  // Audio accessibility state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // USB Barcode Scanner hardware buffer
  const barcodeBufferRef = useRef<string>('');
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── TYPING ANIMATION EFFECT FOR HERO TEXT ──
  const typingPhrases = useMemo(
    () => [
      'Touchless QR Pass Scan & Print',
      'Hold Mobile Screen to Scanner',
      'Instant Autonomous Document Release',
      '24/7 Laser Printing for RIT Students',
    ],
    []
  );
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (currentScreen !== 'ready_to_scan') return;

    const currentPhrase = typingPhrases[currentPhraseIndex];
    const typingSpeed = isDeleting ? 30 : 65;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (typedText.length < currentPhrase.length) {
          setTypedText(currentPhrase.slice(0, typedText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        if (typedText.length > 0) {
          setTypedText(currentPhrase.slice(0, typedText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, currentPhraseIndex, typingPhrases, currentScreen]);

  // Audio Beep Feedback Helper
  const playTouchTone = (freq = 880, duration = 0.08) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  };

  // Fetch machine info to check if Python daemon & printer are alive
  const fetchMachineInfo = async () => {
    try {
      const res = await fetch('/api/machines', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.machines) {
        const found = data.machines.find(
          (m: any) => m.machineCode?.toUpperCase() === machineCode
        );
        if (found) {
          setMachineData(found);
          setIsMachineOnline(found.status === 'online');
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchMachineInfo();
    const interval = setInterval(fetchMachineInfo, 5000);
    return () => clearInterval(interval);
  }, [machineCode]);

  // Screen Inactivity Auto-Reset Timer (Returns to Ready to Scan after 45s of idle on order details)
  useEffect(() => {
    if (currentScreen === 'ready_to_scan' || currentScreen === 'printing' || currentScreen === 'collect_documents') return;

    const idleTimer = setTimeout(() => {
      resetToReady();
    }, 45000);

    return () => clearTimeout(idleTimer);
  }, [currentScreen]);

  // Reset helper
  const resetToReady = () => {
    if (autoPrintTimerRef.current) clearInterval(autoPrintTimerRef.current);
    setCurrentScreen('ready_to_scan');
    setActiveOrder(null);
    setScanError(null);
    setIsVerifyingOrder(false);
    setPrintProgress(0);
    setPrintStep(1);
    setCountdownSeconds(8);
    setAutoPrintCountdown(3);
    fetch('/api/kiosk/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineCode,
        currentScreen: 'ready_to_scan',
        isScannerActive: true,
        clearActiveOrder: true,
      }),
    }).catch(() => {});
  };

  // Notify server of scanner active state
  useEffect(() => {
    const isScannerActive = currentScreen === 'ready_to_scan';
    try {
      fetch('/api/kiosk/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineCode,
          currentScreen,
          isScannerActive,
        }),
      }).catch(() => {});
    } catch {}
  }, [currentScreen, machineCode]);

  // ── CORE QR CODE SCAN PROCESSOR ──
  const handleScannedQrData = useCallback(async (dataString: string) => {
    if (currentScreen !== 'ready_to_scan') return;

    const trimmed = dataString.trim();
    if (!trimmed) return;

    // STRICT: Reject 1D linear product barcodes (8-14 numeric digits)
    if (/^\d{8,14}$/.test(trimmed)) {
      console.warn('1D Linear barcode detected and ignored. Only 2D QR Code is permitted:', trimmed);
      setScanError('1D barcode ignored. Please scan the 2D QR Print Pass!');
      playTouchTone(250, 0.2);
      return;
    }

    playTouchTone(1050, 0.12);
    setIsVerifyingOrder(true);
    setScanError(null);

    try {
      const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData: trimmed,
          machineCode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setIsVerifyingOrder(false);
        setScanError(data.error || 'Invalid QR Pass. Please check your mobile receipt.');
        playTouchTone(220, 0.3);
        return;
      }

      // Order Found & Authenticated!
      setActiveOrder(data.order);
      setIsVerifyingOrder(false);
      setScanError(null);
      setCurrentScreen('order_details');
      playTouchTone(1320, 0.25);

      // Start 3-second automatic print countdown!
      setAutoPrintCountdown(3);
    } catch {
      setIsVerifyingOrder(false);
      setScanError('Connection error verifying QR pass. Please try again.');
      playTouchTone(220, 0.3);
    }
  }, [currentScreen, machineCode]);

  // USB Barcode Scanner Hardware Listener (Always active in ready_to_scan mode!)
  useEffect(() => {
    if (currentScreen !== 'ready_to_scan') {
      barcodeBufferRef.current = '';
      if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen !== 'ready_to_scan') return;

      if (e.key === 'Enter') {
        const buffered = barcodeBufferRef.current.trim();
        if (buffered.length >= 3) {
          handleScannedQrData(buffered);
        }
        barcodeBufferRef.current = '';
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        return;
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
        }, 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, handleScannedQrData]);

  // ── LIVE SERVER-SYNCED SCAN LISTENER (Captures Pi Hardware Scans Instantly) ──
  const lastProcessedOrderIdRef = useRef<string>('');

  useEffect(() => {
    if (currentScreen !== 'ready_to_scan') return;

    const syncTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/kiosk/state?machineCode=${machineCode}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.activeOrder && currentScreen === 'ready_to_scan') {
          const ord = data.activeOrder;
          if (ord.id && ord.id !== lastProcessedOrderIdRef.current) {
            lastProcessedOrderIdRef.current = ord.id;
            playTouchTone(1320, 0.25);
            setActiveOrder(ord);
            setCurrentScreen('order_details');
            setAutoPrintCountdown(3);
          }
        }
      } catch {}
    }, 1000);

    return () => clearInterval(syncTimer);
  }, [currentScreen, machineCode]);

  // ── TRIGGER REAL PRINTING SEQUENCE (SYNCHRONIZED WITH CUPS) ──
  const startPrintingSequence = async () => {
    if (!activeOrder) return;

    if (autoPrintTimerRef.current) {
      clearInterval(autoPrintTimerRef.current);
      autoPrintTimerRef.current = null;
    }

    playTouchTone(1100, 0.2);
    setCurrentScreen('printing');
    setPrintProgress(15);
    setPrintStep(1); // Preparing

    // 1. Immediately enqueue job to Raspberry Pi daemon
    try {
      await fetch('/api/pin/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder?.id,
          orderNumber: activeOrder?.orderNumber,
          pin: activeOrder?.fourDigitPin,
          machineCode,
        }),
      });
    } catch (e) {
      console.warn('Release request dispatch warning:', e);
    }

    setPrintProgress(40);
    setPrintStep(2); // Printing / Spooling

    // 2. Poll CUPS hardware confirmation from /api/kiosk/job-status
    let attempts = 0;
    const maxAttempts = 60; // 60 * 750ms = 45 seconds max
    const checkInterval = 750;

    const pollTimer = setInterval(async () => {
      attempts += 1;

      // Smoothly advance progress up to 85% while waiting for CUPS
      setPrintProgress((prev) => {
        if (prev < 85) return prev + 3;
        return 85;
      });
      if (attempts > 3 && printStep < 3) {
        setPrintStep(3); // Finishing / Waiting for CUPS paper feed
      }

      try {
        const queryParams = new URLSearchParams({
          orderId: String(activeOrder?.id || ''),
          orderNumber: String(activeOrder?.orderNumber || ''),
          pin: String(activeOrder?.fourDigitPin || ''),
        });
        const res = await fetch(`/api/kiosk/job-status?${queryParams.toString()}`);
        const data = await res.json();

        if (data.status === 'completed') {
          // CUPS HARDWARE PRINT CONFIRMED!
          clearInterval(pollTimer);
          setPrintProgress(100);
          setPrintStep(4); // Complete
          playTouchTone(1320, 0.4);

          setTimeout(() => {
            setCurrentScreen('print_complete');
          }, 800);
          return;
        }

        if (data.status === 'failed') {
          clearInterval(pollTimer);
          alert(data.message || 'CUPS Printer Error: Unable to print.');
          resetToReady();
          return;
        }
      } catch (err) {
        console.error('Job status check failed:', err);
      }

      // Timeout if printer does not acknowledge within 45 seconds
      if (attempts >= maxAttempts) {
        clearInterval(pollTimer);
        alert('Hardware Timeout: The printer did not acknowledge paper feed within 45 seconds. Please check the printer paper tray or connection.');
        resetToReady();
        return;
      }
    }, checkInterval);
  };

  // Auto-Print Countdown Timer on Screen 2 (Order Details)
  useEffect(() => {
    if (currentScreen !== 'order_details') return;

    setAutoPrintCountdown(3);
    autoPrintTimerRef.current = setInterval(() => {
      setAutoPrintCountdown((prev) => {
        if (prev <= 1) {
          if (autoPrintTimerRef.current) clearInterval(autoPrintTimerRef.current);
          startPrintingSequence();
          return 0;
        }
        playTouchTone(880, 0.05);
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoPrintTimerRef.current) clearInterval(autoPrintTimerRef.current);
    };
  }, [currentScreen, activeOrder]);

  // Auto Countdown on Screen 5 (Collection Instruction)
  useEffect(() => {
    if (currentScreen !== 'collect_documents') return;

    setCountdownSeconds(8);
    const countTimer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countTimer);
          resetToReady();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countTimer);
  }, [currentScreen]);

  // Demo pass test helper for easy testing without physical scanner
  const handleSimulateQuickScan = () => {
    handleScannedQrData(JSON.stringify({
      orderId: 'ord_demo_test',
      orderNumber: 'PP1025',
      pin: '4829',
      fileName: 'Campus_Notes_Unit_3.pdf',
    }));
  };

  return (
    <div className="h-screen max-h-screen w-full bg-[#f8fafc] bg-futuristic-grid text-slate-900 font-sans antialiased select-none flex flex-col justify-between overflow-hidden relative">
      
      {/* Ambient Lighting Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* ── TOP UNIFIED HEADER (56px) ── */}
      <header className="h-14 px-4 sm:px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/rit-logo.png"
            alt="Rajalakshmi Institute of Technology"
            className="h-8 w-auto object-contain block shrink-0"
          />
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Autonomous Print Kiosk</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors ${
            isMachineOnline
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isMachineOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{machineCode} &bull; {isMachineOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            title="Toggle Audio Feedback"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE AREA ── */}
      <main className="flex-1 min-h-0 px-4 sm:px-8 py-2 sm:py-4 flex flex-col items-center justify-center overflow-y-auto no-scrollbar z-10 w-full">
        <div className="max-w-4xl w-full flex flex-col justify-center items-center min-h-0 my-auto">

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 1: READY TO SCAN (PERMANENT IDLE STATE)                 */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'ready_to_scan' && (
            <div className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.9)] flex flex-col items-center text-center space-y-5 relative overflow-hidden animate-in fade-in duration-200">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />

              {/* Status Header */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="font-mono font-black">Optical Scanner Active &bull; Ready to Scan</span>
              </div>

              {/* Terminal Title & Typing Pill */}
              <div className="space-y-2 max-w-lg mx-auto">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Scan Your QR Pass
                </h1>

                {/* Sleek Kinetic Telemetry Typing Pill */}
                <div className="min-h-[38px] flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs sm:text-sm font-semibold tracking-wide shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                    <span className="font-mono">{typedText}</span>
                    <span className="w-1 h-3.5 bg-blue-600 animate-pulse rounded-full" />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                  Hold your mobile phone with the <span className="text-blue-600 font-bold">QR Pass</span> in front of the kiosk scanner below. Printing begins automatically!
                </p>
              </div>

              {/* Center Holographic Scanner Target Animation */}
              <div className="relative my-2 flex flex-col items-center justify-center">
                
                {/* Outer Glow Ring */}
                <div className="w-56 h-56 rounded-3xl bg-gradient-to-b from-blue-50 to-indigo-50/60 border-2 border-blue-200 flex flex-col items-center justify-center relative shadow-inner overflow-hidden group">
                  
                  {/* Target Crosshair Corners */}
                  <div className="absolute inset-5 border-2 border-dashed border-blue-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-blue-600 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-blue-600 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-blue-600 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-blue-600 rounded-br-lg" />

                    {/* Animated Scanning Beam */}
                    <div
                      className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-lg shadow-blue-500/80 animate-bounce duration-1000 opacity-90"
                    />

                    {/* Hologram QR Icon */}
                    <div className="flex flex-col items-center justify-center space-y-2 opacity-80 group-hover:scale-105 transition-transform">
                      <QrCode className="h-20 w-20 text-blue-600 stroke-[1.5] animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-widest">
                        Hold Pass Here
                      </span>
                    </div>
                  </div>

                  {/* Verification Spinner Overlay if processing */}
                  {isVerifyingOrder && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 z-10 animate-fade-in">
                      <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                      <span className="text-xs font-bold text-slate-800">Verifying Pass...</span>
                    </div>
                  )}
                </div>

                <span className="text-[11px] font-mono font-bold text-slate-400 mt-2.5">
                  Scanner Lens Distance: 10cm - 15cm
                </span>
              </div>

              {/* Error Alert if any */}
              {scanError && (
                <div className="w-full max-w-md p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* 3 Step Touchless Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full pt-1 text-left">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">1</div>
                  <span className="text-[11px] font-semibold text-slate-700">Open QR Pass on mobile</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">2</div>
                  <span className="text-[11px] font-semibold text-slate-700">Hold near scanner</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">3</div>
                  <span className="text-[11px] font-semibold text-slate-700">Auto-prints in seconds</span>
                </div>
              </div>

              {/* Discreet Demo Helper */}
              <div className="w-full pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Kyocera MFP Ready (Duplex A4)</span>
                </div>
                <button
                  onClick={handleSimulateQuickScan}
                  className="text-[10px] font-mono text-slate-400 hover:text-blue-600 underline cursor-pointer"
                  title="Simulate scanning a demo pass"
                >
                  Test Demo Pass &rarr;
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 2: ORDER DETAILS & AUTOMATIC PRINT COUNTDOWN            */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'order_details' && activeOrder && (
            <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col space-y-5 relative overflow-hidden animate-in fade-in duration-150">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600" />

              {/* Header Badge */}
              <div className="text-center space-y-1 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-black uppercase tracking-wider">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>QR Pass Verified &bull; Order Authenticated</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
                  Ready to Print
                </h2>
                <p className="text-xs text-slate-500">
                  Document detected successfully. Review details below:
                </p>
              </div>

              {/* 2-Column Specs & Payment Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Left Card: Document Specs */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-3.5 text-left">
                  <div className="w-14 h-16 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-0.5 text-xs min-w-0">
                    <span className="font-extrabold text-slate-900 block truncate max-w-[170px]" title={activeOrder.fileName}>
                      {activeOrder.fileName || 'Document.pdf'}
                    </span>
                    <div className="text-slate-500 space-y-0.5 pt-0.5 text-[11px]">
                      <div>Pages: <b className="text-slate-800">{activeOrder.calculatedPrintPages || activeOrder.pages || 1}</b></div>
                      <div>Copies: <b className="text-slate-800">{activeOrder.copies || 1}</b></div>
                      <div>Type: <b className="text-blue-600 uppercase">{(activeOrder.colorMode === 'color' ? 'Color' : 'Black & White')} ({(activeOrder.duplexMode === 'double' || activeOrder.duplexMode === 'duplex') ? 'Duplex' : 'Single Sided'})</b></div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Payment Verified */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-center items-center text-center space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Amount
                  </span>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    ₹ {
                      activeOrder.amount 
                        ? activeOrder.amount 
                        : activeOrder.totalAmountRupees 
                        ? activeOrder.totalAmountRupees.replace('₹', '').trim()
                        : activeOrder.total_amount_paise 
                        ? (activeOrder.total_amount_paise / 100).toFixed(2)
                        : activeOrder.totalAmountPaise 
                        ? (activeOrder.totalAmountPaise / 100).toFixed(2)
                        : '2.00'
                    }
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Payment Verified</span>
                  </span>
                </div>

              </div>

              {/* Automatic Print Countdown Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-mono font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 animate-pulse">
                    {autoPrintCountdown}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-950">
                      Printing automatically in {autoPrintCountdown} seconds...
                    </h4>
                    <p className="text-[11px] text-blue-700">
                      Or tap <span className="font-bold">Print Now</span> to begin immediately!
                    </p>
                  </div>
                </div>

                <button
                  onClick={startPrintingSequence}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Now</span>
                </button>
              </div>

              {/* Action Buttons: Cancel */}
              <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                <button
                  onClick={resetToReady}
                  className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel / Back to Scanner</span>
                </button>
                <span className="font-mono text-[11px] text-slate-400">Order #{activeOrder.orderNumber || activeOrder.id?.slice(0, 8)}</span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 3: PRINTING PROGRESS                                    */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'printing' && (
            <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-between text-center space-y-6 relative overflow-hidden animate-in fade-in duration-200">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 animate-pulse" />

              {/* Circular Radial Gauge */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2">
                <div
                  className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"
                  style={{ animationDuration: '1.2s' }}
                />
                <div className="w-24 h-24 rounded-full bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-blue-600 shadow-inner">
                  <Printer className="h-9 w-9 animate-pulse" />
                  <span className="text-xs font-mono font-black mt-1">{printProgress}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Printing in Progress...
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Sending pages to Kyocera Laser Printer. Please wait...
                </p>
              </div>

              {/* 4-Step Progress Stepper Bar */}
              <div className="w-full grid grid-cols-4 gap-2 pt-2 text-[11px] font-bold">
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    printStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {printStep > 1 ? '✓' : '1'}
                  </div>
                  <span className={printStep >= 1 ? 'text-blue-700' : 'text-slate-400'}>Spooling</span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    printStep >= 2 ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {printStep > 2 ? '✓' : '2'}
                  </div>
                  <span className={printStep >= 2 ? 'text-blue-700 font-black' : 'text-slate-400'}>Fuser Warmup</span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    printStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {printStep > 3 ? '✓' : '3'}
                  </div>
                  <span className={printStep >= 3 ? 'text-blue-700' : 'text-slate-400'}>Paper Feed</span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    printStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    4
                  </div>
                  <span className={printStep >= 4 ? 'text-emerald-700' : 'text-slate-400'}>Complete</span>
                </div>
              </div>

              <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex justify-between font-mono">
                <span className="truncate max-w-[200px]">{activeOrder?.fileName || 'Document'}</span>
                <span>{activeOrder?.calculatedPrintPages || 1} pages</span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 4: PRINT COMPLETE                                       */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'print_complete' && (
            <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-between text-center space-y-6 relative overflow-hidden animate-in fade-in duration-200">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-green-600" />

              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Print Completed!
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Your documents have been dispatched to the output tray.
                </p>
              </div>

              {/* Summary Card */}
              <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 text-left font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Order ID:</span>
                  <span className="font-bold text-slate-900">{activeOrder?.orderNumber || 'PP1025'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Document:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[180px]">{activeOrder?.fileName || 'Document.pdf'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Pages Printed:</span>
                  <span className="font-bold text-slate-900">{activeOrder?.calculatedPrintPages || 10}</span>
                </div>
              </div>

              {/* Zero-Trace Privacy Assurance */}
              <div className="w-full p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-800 space-y-2 text-left">
                <div className="flex items-center gap-2 font-black text-emerald-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Zero-Trace Privacy &bull; Document Shredded</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-medium leading-tight">
                  DoD 5220.22-M zero-wipe applied. Your document file has been safely deleted from storage.
                </p>
              </div>

              <div className="w-full pt-1">
                <button
                  onClick={() => {
                    playTouchTone(1050);
                    setCurrentScreen('collect_documents');
                  }}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer"
                >
                  <span>Collect Documents</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 5: COLLECTION INSTRUCTION (OUTPUT TRAY ANIMATION)       */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'collect_documents' && (
            <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-between text-center space-y-6 relative overflow-hidden animate-in fade-in duration-200">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

              <div className="space-y-1 pt-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Collect Your Documents
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Please take your printed pages from the output tray below.
                </p>
              </div>

              {/* Animated Paper Output Tray Graphic */}
              <div className="w-64 h-48 bg-gradient-to-b from-blue-50/50 to-slate-100 rounded-3xl border-2 border-blue-200 p-6 flex flex-col items-center justify-center relative shadow-inner overflow-hidden group">
                <div className="w-32 h-24 bg-white rounded-xl shadow-lg border border-slate-300 flex flex-col items-center justify-center p-2 relative animate-bounce" style={{ animationDuration: '2s' }}>
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="w-16 h-1 bg-slate-200 rounded mt-1.5" />
                  <div className="w-10 h-1 bg-slate-200 rounded mt-1" />
                  <div className="absolute -bottom-2 text-blue-600">
                    &darr;
                  </div>
                </div>

                <div className="w-48 h-4 bg-slate-800 rounded-full mt-4 shadow-md flex items-center justify-center">
                  <div className="w-36 h-1 bg-slate-600 rounded-full" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">
                  Paper Dispenser Output Tray
                </span>
              </div>

              {/* Auto-Timeout Notice */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 w-full flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Resetting to ready state in <b className="text-blue-600">{countdownSeconds}s</b></span>
              </div>

              <div className="w-full pt-1">
                <button
                  onClick={resetToReady}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Finished &bull; Ready for Next Customer</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MINIMAL CLEAN FOOTER BAR (32px) ── */}
      <footer className="h-8 px-4 sm:px-8 border-t border-slate-200/90 bg-white/95 backdrop-blur-md flex items-center justify-between text-slate-500 text-[10px] sm:text-xs z-10 shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-medium text-slate-700">RIT Autonomous Printing Kiosk</span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
          <span>Terminal: {machineCode}</span>
          <span>&bull;</span>
          <span className="text-emerald-600 font-bold">Touchless QR Release Active</span>
        </div>
      </footer>

    </div>
  );
}
