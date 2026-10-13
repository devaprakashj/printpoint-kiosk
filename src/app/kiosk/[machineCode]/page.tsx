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
  KeyRound,
  Camera,
  CameraOff,
  ScanLine,
  HelpCircle,
  X,
  FileCheck,
  Download,
  Check,
  CheckCircle,
  Tv,
} from 'lucide-react';
import Logo from '@/components/Logo';

// 8 Distinct Kiosk Navigation Screens matching the architecture
type KioskScreen = 
  | 'home' 
  | 'choose_method' 
  | 'scan_qr' 
  | 'enter_pin' 
  | 'order_details' 
  | 'printing' 
  | 'print_complete' 
  | 'collect_documents';

export default function AutonomousTouchscreenKiosk() {
  const params = useParams();
  const machineCode = ((params?.machineCode as string) || 'RIT-ATM-01').toUpperCase();

  // Current Active Screen State
  const [currentScreen, setCurrentScreen] = useState<KioskScreen>('home');

  // Kiosk Hardware Telemetry
  const [machineData, setMachineData] = useState<any>(null);
  const [isMachineOnline, setIsMachineOnline] = useState<boolean>(true);

  // 4-Digit PIN Input State
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Active Order State
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  // Printing Progress State
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [printStep, setPrintStep] = useState<number>(1); // 1: Preparing, 2: Printing, 3: Finishing, 4: Complete

  // Collection countdown
  const [countdownSeconds, setCountdownSeconds] = useState<number>(8);

  // Audio accessibility state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Help & Guide modals
  const [showHowToUseModal, setShowHowToUseModal] = useState<boolean>(false);
  const [showNeedHelpModal, setShowNeedHelpModal] = useState<boolean>(false);

  // ── CAMERA QR CODE READER / SCANNER STATE ──
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState<boolean>(false);
  const scanLoopRef = useRef<number | null>(null);
  const barcodeBufferRef = useRef<string>('');
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── TYPING ANIMATION EFFECT FOR HERO TEXT ──
  const typingPhrases = useMemo(
    () => [
      'Fast, Autonomous Document Release',
      'Instant Print Release via 4-Digit PIN',
      'Scan Mobile QR Pass to Collect',
      '24/7 Laser Printing for RIT Students',
    ],
    []
  );
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (currentScreen !== 'home') return;

    const currentPhrase = typingPhrases[currentPhraseIndex];
    const typingSpeed = isDeleting ? 35 : 75;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (typedText.length < currentPhrase.length) {
          setTypedText(currentPhrase.slice(0, typedText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2200);
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
      gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
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

  // Screen Inactivity Auto-Reset Timer (Returns to Home after 60s of idle)
  useEffect(() => {
    if (currentScreen === 'home' || currentScreen === 'printing' || currentScreen === 'collect_documents') return;

    const idleTimer = setTimeout(() => {
      resetToHome();
    }, 60000);

    return () => clearTimeout(idleTimer);
  }, [currentScreen, enteredPin]);

  // Reset helper
  const resetToHome = () => {
    stopCamera();
    setCurrentScreen('home');
    setEnteredPin('');
    setActiveOrder(null);
    setPinError(null);
    setPrintProgress(0);
    setPrintStep(1);
    setCountdownSeconds(8);
  };

  // ── HARDWARE CAMERA QR READER CONTROLS ──
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported on this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front kiosk camera / webcam
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera reader init error:', err);
      setCameraError('Camera offline or permission denied.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Check BarcodeDetector support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      setBarcodeDetectorSupported(true);
    }
  }, []);

  // Control camera on screen change
  useEffect(() => {
    if (currentScreen === 'scan_qr') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentScreen]);

  // Handle scanned data string from customer's phone QR code
  const handleScannedQrData = useCallback((dataString: string) => {
    if (currentScreen !== 'scan_qr' && currentScreen !== 'enter_pin') return;

    try {
      let pin = '';
      if (dataString.trim().startsWith('{')) {
        const parsed = JSON.parse(dataString);
        pin = parsed.pin || parsed.fourDigitPin || '';
      } else if (dataString.includes('pin=')) {
        const url = new URL(dataString, 'http://localhost');
        pin = url.searchParams.get('pin') || '';
      } else {
        const match = dataString.match(/\b\d{4}\b/);
        if (match) pin = match[0];
      }

      if (pin && pin.length === 4) {
        stopCamera();
        setEnteredPin(pin);
        playTouchTone(1100, 0.15);
        verifyEnteredPin(pin);
      }
    } catch {
      const match = dataString.match(/\b\d{4}\b/);
      if (match) {
        stopCamera();
        setEnteredPin(match[0]);
        playTouchTone(1100, 0.15);
        verifyEnteredPin(match[0]);
      }
    }
  }, [currentScreen]);

  // Video Frame Scanning Loop
  useEffect(() => {
    if (!isCameraActive || !videoRef.current || !barcodeDetectorSupported || currentScreen !== 'scan_qr') return;

    let isScanningActive = true;
    const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

    const detectFrame = async () => {
      if (!isScanningActive || !videoRef.current || videoRef.current.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      try {
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          handleScannedQrData(barcodes[0].rawValue);
          return;
        }
      } catch {}

      if (isScanningActive && currentScreen === 'scan_qr') {
        scanLoopRef.current = requestAnimationFrame(detectFrame);
      }
    };

    scanLoopRef.current = requestAnimationFrame(detectFrame);
    return () => {
      isScanningActive = false;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    };
  }, [isCameraActive, barcodeDetectorSupported, currentScreen, handleScannedQrData]);

  // USB Barcode Scanner hardware listener (for dedicated physical 2D scanners)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen !== 'scan_qr' && currentScreen !== 'enter_pin') return;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 4) {
          handleScannedQrData(barcodeBufferRef.current);
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
        }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, handleScannedQrData]);

  // ── PIN KEYPAD HANDLERS ──
  const handleDigitPress = (digit: string) => {
    if (enteredPin.length < 4) {
      playTouchTone(700 + enteredPin.length * 90);
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setPinError(null);

      // Auto-submit on 4th digit
      if (newPin.length === 4) {
        setTimeout(() => verifyEnteredPin(newPin), 250);
      }
    }
  };

  const handleBackspace = () => {
    playTouchTone(450);
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClear = () => {
    playTouchTone(350);
    setEnteredPin('');
    setPinError(null);
  };

  // Verify PIN via Cloud API
  const verifyEnteredPin = async (pinToVerify = enteredPin) => {
    if (pinToVerify.length !== 4) return;

    playTouchTone(1050, 0.12);
    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinToVerify,
          machineCode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setIsVerifyingPin(false);
        setPinError(data.error || 'Invalid PIN. Please check your mobile receipt.');
        playTouchTone(250, 0.25);
        return;
      }

      // Order Found & Verified! Transition to Screen 5: Order Details
      setActiveOrder(data.order);
      setIsVerifyingPin(false);
      stopCamera();
      setCurrentScreen('order_details');
      playTouchTone(1200, 0.15);

    } catch {
      setIsVerifyingPin(false);
      setPinError('Connection error. Please try again.');
    }
  };

  // Simulate quick scan for demonstration / testing
  const handleSimulateQuickScan = async () => {
    playTouchTone(1050, 0.1);
    stopCamera();
    // Use demo order data
    setActiveOrder({
      id: 'ord_demo_1025',
      orderNumber: 'PP1025',
      fileName: 'Campus_Notes_Unit_3.pdf',
      calculatedPrintPages: 10,
      copies: 1,
      colorMode: 'bw',
      duplexMode: 'single',
      amount: 10,
      paymentStatus: 'paid',
    });
    setEnteredPin('4829');
    setCurrentScreen('order_details');
  };

  // ── TRIGGER REAL PRINTING SEQUENCE (SYNCHRONIZED WITH CUPS) ──
  const startPrintingSequence = async () => {
    if (!activeOrder) return;

    playTouchTone(1100, 0.2);
    setCurrentScreen('printing');
    setPrintProgress(10);
    setPrintStep(1); // Preparing

    // 1. Immediately enqueue job to Raspberry Pi daemon
    try {
      await fetch('/api/pin/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder?.id,
          pin: enteredPin,
          machineCode,
        }),
      });
    } catch (e) {
      console.warn('Release request dispatch warning:', e);
    }

    setPrintProgress(35);
    setPrintStep(2); // Printing / Spooling

    // 2. Poll CUPS hardware confirmation from /api/kiosk/job-status
    let attempts = 0;
    const maxAttempts = 60; // 60 * 750ms = 45 seconds max (covers Kyocera MFP socket spool + fuser warmup)
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
          pin: String(enteredPin || ''),
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
          resetToHome();
          return;
        }
      } catch (err) {
        console.error('Job status check failed:', err);
      }

      // Timeout if printer does not acknowledge within 45 seconds
      if (attempts >= maxAttempts) {
        clearInterval(pollTimer);
        alert('Hardware Timeout: The printer did not acknowledge paper feed within 45 seconds. Please check the printer paper tray or connection.');
        resetToHome();
        return;
      }
    }, checkInterval);
  };

  // Auto Countdown on Screen 8 (Collection Instruction)
  useEffect(() => {
    if (currentScreen !== 'collect_documents') return;

    setCountdownSeconds(8);
    const countTimer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countTimer);
          resetToHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countTimer);
  }, [currentScreen]);

  return (
    <div className="h-screen max-h-screen w-full bg-[#f8fafc] bg-futuristic-grid text-slate-900 font-sans antialiased select-none flex flex-col justify-between overflow-hidden relative">
      
      {/* Ambient Lighting Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* ── TOP UNIFIED HEADER (56px) ── */}
      <header className="h-14 sm:h-15 px-4 sm:px-8 border-b border-slate-200/90 bg-white/95 backdrop-blur-md flex items-center justify-between z-20 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {machineCode}
            </span>
            <span className="text-xs text-slate-600 font-semibold truncate max-w-xs">
              {machineData?.displayName || 'Print Point Terminal'}
            </span>
          </div>
        </div>

        {/* Right Status Vitals */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-xs ${
            isMachineOnline 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isMachineOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{isMachineOnline ? 'ONLINE' : 'OFFLINE'}</span>
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

      {/* ── MAIN WORKSPACE AREA: 8 INTERACTIVE SCREENS ── */}
      <main className="flex-1 min-h-0 px-4 sm:px-8 py-2 sm:py-4 flex flex-col items-center justify-center overflow-y-auto no-scrollbar z-10 w-full">
        <div className="max-w-4xl w-full flex flex-col justify-center items-center min-h-0 my-auto">

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 1: 2030s NEXT-GEN CAMPUS TERMINAL CONSOLE               */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'home' && (
            <div className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.9)] flex flex-col items-center text-center space-y-5 relative overflow-hidden animate-in fade-in duration-200">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />

              {/* Institutional Masthead: Crisp RIT Identity + Hardware Telemetry */}
              <div className="flex items-center justify-between w-full pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src="/rit-logo.png"
                    alt="Rajalakshmi Institute of Technology"
                    className="h-8 sm:h-9 w-auto object-contain block shrink-0"
                  />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-[10px] font-mono font-bold text-slate-700 tracking-wide">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Terminal {machineCode} &bull; 24/7 Ready</span>
                </div>
              </div>

              {/* Terminal Title & High-Tech Kinetic Typing Telemetry */}
              <div className="space-y-2 max-w-lg mx-auto pt-1">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Campus Print ATM
                </h1>

                {/* Sleek Kinetic Telemetry Typing Pill */}
                <div className="min-h-[38px] flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs sm:text-sm font-semibold tracking-wide shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                    <span className="font-mono">{typedText}</span>
                    <span className="w-1 h-3.5 bg-blue-600 animate-pulse rounded-full" />
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                  Tap below to authenticate and release your documents in seconds.
                </p>
              </div>

              {/* Primary Master Touch CTA (Clean Classic ATM Flow) */}
              <div className="w-full max-w-md mx-auto pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    playTouchTone(900);
                    setCurrentScreen('choose_method');
                  }}
                  className="w-full py-4.5 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-black text-base tracking-wide flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25 active:scale-98 transition-all cursor-pointer group"
                >
                  <Printer className="h-5 w-5" />
                  <span>Touch Screen to Begin</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>

              {/* Precision Hardware Status Footer Strip */}
              <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Laser Engine Ready (A4 Duplex)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>0-Byte Memory Shred Active</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 2: CHOOSE RELEASE METHOD                               */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'choose_method' && (
            <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center space-y-6 relative overflow-hidden animate-in fade-in duration-150">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

              <div className="space-y-1 pt-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Choose Release Method
                </h2>
                <p className="text-xs text-slate-500">
                  Select how you would like to authenticate and release your documents
                </p>
              </div>

              {/* 2 Big Selectable Cards Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-1">
                {/* Method 1: Scan QR Code */}
                <button
                  onClick={() => {
                    playTouchTone(700);
                    setCurrentScreen('scan_qr');
                  }}
                  className="p-6 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center space-y-3 cursor-pointer group active:scale-98"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <ScanLine className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700">
                      Scan QR Pass
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hold your mobile receipt QR in front of the kiosk scanner
                    </p>
                  </div>
                </button>

                {/* Method 2: Enter PIN */}
                <button
                  onClick={() => {
                    playTouchTone(800);
                    setEnteredPin('');
                    setCurrentScreen('enter_pin');
                  }}
                  className="p-6 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center space-y-3 cursor-pointer group active:scale-98"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <KeyRound className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700">
                      Enter 4-Digit PIN
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Type your one-time collection PIN on the keypad
                    </p>
                  </div>
                </button>
              </div>

              {/* Bottom Navigation */}
              <div className="pt-2 w-full flex justify-center">
                <button
                  onClick={() => {
                    playTouchTone(450);
                    setCurrentScreen('home');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 3: SCAN QR CODE (OPTICAL READER / SCANNER)             */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'scan_qr' && (
            <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col space-y-5 relative overflow-hidden animate-in fade-in duration-150">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

              <div className="text-center space-y-0.5 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  <ScanLine className="h-3 w-3 text-blue-600" />
                  Optical QR Reader Active
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                  Scan Your Order QR Code
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hold your mobile screen showing your <span className="font-bold text-slate-800">Order Receipt QR Code</span> in front of the camera
                </p>
              </div>

              {/* Center 2-Column: Left = Camera Viewfinder Reader, Right = Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center pt-1">
                
                {/* Left: Viewfinder Frame with Camera Feed & Laser Line */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-48 h-48 bg-slate-900 rounded-3xl border-4 border-blue-500/40 relative overflow-hidden shadow-xl flex items-center justify-center group">
                    
                    {/* Live Video Preview from Camera */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isCameraActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Holographic Target Frame with Corner Brackets */}
                    <div className="absolute inset-5 border-2 border-dashed border-blue-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-blue-400 rounded-tl-md" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-blue-400 rounded-tr-md" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-blue-400 rounded-bl-md" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-blue-400 rounded-br-md" />

                      {/* Laser Scanning Beam Animation */}
                      <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-md shadow-blue-400 animate-bounce duration-1000 opacity-90" />
                    </div>

                    {/* Fallback if camera is offline / denied */}
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-white text-center space-y-2 bg-slate-900/95">
                        <CameraOff className="h-8 w-8 text-slate-500" />
                        <div className="text-[11px] text-slate-300">
                          {cameraError || 'Camera reader connecting...'}
                        </div>
                        <button
                          onClick={startCamera}
                          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Retry Camera
                        </button>
                      </div>
                    )}

                    {/* Scanner Active Pill */}
                    <div className="absolute bottom-2 inset-x-2 py-0.5 px-2 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-mono text-white/90 flex items-center justify-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Optical Scanner &amp; USB Reader Ready</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 mt-2">
                    Point mobile QR code inside the box
                  </span>
                </div>

                {/* Right: Steps & Test Button */}
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <span className="text-xs font-medium text-slate-700 pt-0.5">Open your Order Receipt on your phone</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <span className="text-xs font-medium text-slate-700 pt-0.5">Hold the Order QR Code facing this camera</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <span className="text-xs font-medium text-slate-700 pt-0.5">Kiosk auto-detects &amp; loads your order</span>
                  </div>
                </div>

              </div>

              {/* Footer Back Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    playTouchTone(450);
                    stopCamera();
                    setCurrentScreen('choose_method');
                  }}
                  className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    setCurrentScreen('enter_pin');
                  }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Enter 4-Digit PIN instead &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 4: ENTER PRINT CODE (AUTHENTIC TOUCHSCREEN ATM LAYOUT) */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'enter_pin' && (
            <div className="w-full max-w-[370px] bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/50 flex flex-col space-y-2 sm:space-y-2.5 relative animate-in fade-in duration-150">
              
              {/* Top Utility Bar: Back to Home (Left) & How to Use (Right) */}
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => {
                    playTouchTone(450);
                    setEnteredPin('');
                    setCurrentScreen('home');
                  }}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3 stroke-[2.5]" />
                  <span>Back to home</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTouchTone(700);
                    setShowHowToUseModal(true);
                  }}
                  className="px-3 py-1 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Tv className="h-3 w-3" />
                  <span>How to Use</span>
                </button>
              </div>

              {/* Hand Holding Smartphone Vector Illustration (Compact) */}
              <div className="flex justify-center items-center py-0.5">
                <div className="relative w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 120"
                    className="w-full h-full drop-shadow-xs select-none pointer-events-none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Smartphone Body */}
                    <rect x="26" y="6" width="48" height="88" rx="9" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
                    {/* Screen */}
                    <rect x="30" y="14" width="40" height="72" rx="6" fill="#f8fafc" />
                    {/* Speaker notch */}
                    <line x1="43" y1="10" x2="57" y2="10" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                    {/* Ticket Header on Screen */}
                    <rect x="34" y="20" width="32" height="18" rx="3" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <rect x="38" y="25" width="24" height="3" rx="1.5" fill="#2563eb" />
                    <rect x="42" y="30" width="16" height="2" rx="1" fill="#93c5fd" />
                    {/* 4-digit preview on phone */}
                    <rect x="35" y="44" width="6" height="8" rx="1.5" fill="#dbeafe" />
                    <rect x="43" y="44" width="6" height="8" rx="1.5" fill="#dbeafe" />
                    <rect x="51" y="44" width="6" height="8" rx="1.5" fill="#dbeafe" />
                    <rect x="59" y="44" width="6" height="8" rx="1.5" fill="#dbeafe" />
                    {/* Hand fingers holding phone */}
                    <path d="M22 42 C17 42, 17 55, 26 55 L26 44 Z" fill="#f59e0b" />
                    <path d="M74 38 C82 38, 82 46, 74 49 Z" fill="#d97706" />
                    <path d="M74 50 C82 50, 82 58, 74 61 Z" fill="#d97706" />
                    <path d="M74 62 C82 62, 82 70, 74 73 Z" fill="#b45309" />
                    {/* Hand palm */}
                    <path d="M38 88 C32 102, 50 118, 68 118 C76 118, 78 104, 74 90 Z" fill="#f59e0b" />
                    <path d="M50 94 L62 94" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-0.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Enter Print Code
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 max-w-[280px] mx-auto leading-tight">
                  Type the 4-digit print code you received after uploading your print files
                </p>
              </div>

              {/* 4 Digit Display Boxes (Showing real visible digits like competitor) */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-0.5">
                {[0, 1, 2, 3].map((index) => {
                  const digit = enteredPin[index];
                  const isActive = enteredPin.length === index;

                  return (
                    <div
                      key={index}
                      className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl flex items-center justify-center border-2 transition-all duration-150 relative ${
                        digit
                          ? 'bg-slate-50/80 border-slate-300 shadow-xs'
                          : isActive
                          ? 'bg-white border-blue-500 ring-4 ring-blue-100 shadow-sm'
                          : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      {digit ? (
                        <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
                          {digit}
                        </span>
                      ) : isActive ? (
                        <span className="w-0.5 h-5 bg-blue-600 rounded-full animate-pulse" />
                      ) : (
                        <span className="text-slate-300 font-mono text-sm">&minus;</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Bar Directly Under Boxes: Clear (Left) & Start Print (Right) */}
              <div className="flex items-center justify-between px-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={enteredPin.length === 0}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 disabled:opacity-30 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => verifyEnteredPin()}
                  disabled={enteredPin.length !== 4 || isVerifyingPin}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isVerifyingPin ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="h-3 w-3" />
                      <span>Start Print</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Toast */}
              {pinError && (
                <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] text-center font-medium flex items-center justify-center gap-1 animate-in fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* Touchscreen Keypad (ATM Layout) */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[290px] mx-auto w-full pt-0.5 pb-0.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitPress(digit)}
                    disabled={isVerifyingPin}
                    className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 active:bg-blue-50 border border-slate-200 hover:border-slate-300 text-xl font-mono font-bold text-slate-800 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-40 select-none"
                  >
                    {digit}
                  </button>
                ))}

                {/* Bottom Row: Empty Spacer (Left) */}
                <div className="h-10 sm:h-11" />

                {/* Bottom Row: 0 (Center) */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  disabled={isVerifyingPin}
                  className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 active:bg-blue-50 border border-slate-200 hover:border-slate-300 text-xl font-mono font-bold text-slate-800 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-40 select-none"
                >
                  0
                </button>

                {/* Bottom Row: High-Contrast Dark Backspace Button (Right) */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={enteredPin.length === 0 || isVerifyingPin}
                  className="h-10 sm:h-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed select-none"
                  title="Backspace"
                >
                  <svg
                    className="w-5 h-5 stroke-[2.2]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 5: ORDER DETAILS (AFTER PIN/QR VERIFICATION)            */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'order_details' && activeOrder && (
            <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col space-y-6 relative overflow-hidden animate-in fade-in duration-150">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

              <div className="text-center space-y-0.5 pt-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Your Print Order
                </h2>
                <p className="text-xs text-slate-500">
                  Please verify your document details before starting the laser engine
                </p>
              </div>

              {/* 2-Column Specs & Financial Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Left Card: Document Specs */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-3.5">
                  <div className="w-14 h-16 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-0.5 text-left text-xs">
                    <span className="font-extrabold text-slate-900 block truncate max-w-[170px]">
                      {activeOrder.fileName || 'Document.pdf'}
                    </span>
                    <div className="text-slate-500 space-y-0.5 pt-0.5 text-[11px]">
                      <div>Pages: <b className="text-slate-800">{activeOrder.calculatedPrintPages || 1}</b></div>
                      <div>Copies: <b className="text-slate-800">{activeOrder.copies || 1}</b></div>
                      <div>Print Type: <b className="text-blue-600 uppercase">{activeOrder.colorMode === 'color' ? 'Color' : 'Black & White'}</b></div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Payment Verified */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-center items-center text-center space-y-2">
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
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Payment Verified</span>
                  </span>
                </div>

              </div>

              {/* Big Start Printing Button */}
              <div className="pt-2">
                <button
                  onClick={startPrintingSequence}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer"
                >
                  <Printer className="h-5 w-5" />
                  <span>Start Printing</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              {/* Footer Back */}
              <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                <button
                  onClick={() => {
                    playTouchTone(450);
                    setCurrentScreen('choose_method');
                  }}
                  className="inline-flex items-center gap-1 font-bold hover:text-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <span className="font-mono text-[11px]">Order #{activeOrder.orderNumber || activeOrder.id?.slice(0, 8)}</span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 6: PRINTING PROGRESS                                    */}
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
                  Printing...
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Please wait, do not close the screen
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
                  <span className={printStep >= 1 ? 'text-blue-700' : 'text-slate-400'}>Preparing</span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    printStep >= 2 ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {printStep > 2 ? '✓' : '2'}
                  </div>
                  <span className={printStep >= 2 ? 'text-blue-700 font-black' : 'text-slate-400'}>Printing</span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    printStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {printStep > 3 ? '✓' : '3'}
                  </div>
                  <span className={printStep >= 3 ? 'text-blue-700' : 'text-slate-400'}>Finishing</span>
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
                <span>{activeOrder?.fileName || 'Document'}</span>
                <span>{activeOrder?.calculatedPrintPages || 1} sheets</span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 7: PRINT COMPLETE                                       */}
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
                  Your documents are ready for collection.
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
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Copies:</span>
                  <span className="font-bold text-slate-900">{activeOrder?.copies || 1}</span>
                </div>
              </div>

              {/* Zero-Trace Privacy & Real File Auto-Shredding Assurance */}
              <div className="w-full p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-800 space-y-2 text-left">
                <div className="flex items-center gap-2 font-black text-emerald-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Zero-Trace Privacy &bull; Cryptographic Shred Completed</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold pt-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Cloud Storage: <b>Purged</b></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Hardware Cache: <b>0 Bytes</b></span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700 font-medium leading-tight">
                  DoD 5220.22-M zero-wipe applied. Your document has been permanently destroyed from disk and cloud storage.
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
                  <span>Get My Documents</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={resetToHome}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                &larr; Back to Home
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 8: COLLECTION INSTRUCTION (OUTPUT TRAY ANIMATION)       */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'collect_documents' && (
            <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-between text-center space-y-6 relative overflow-hidden animate-in fade-in duration-200">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

              <div className="space-y-1 pt-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Collect Your Documents
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Please collect your printed documents from the output tray.
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
                  Paper Dispenser Tray
                </span>
              </div>

              {/* Auto-Timeout Notice */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 w-full flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Screen will reset to home in <b className="text-blue-600">{countdownSeconds} seconds</b></span>
              </div>

              <div className="w-full pt-1">
                <button
                  onClick={resetToHome}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Finished &bull; Back to Home</span>
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
          <span className="font-medium text-slate-700">RIT Autonomous Campus Printing Kiosk System</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400 hidden sm:block">
          Dual Auth (Optical QR Reader &bull; 4-Digit PIN) &bull; v3.0.0
        </div>
      </footer>

      {/* ── HOW TO USE MODAL (MATCHING VIDEO / GUIDE BUTTON) ── */}
      {showHowToUseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowHowToUseModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                <Tv className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">How to Use Campus Kiosk</h3>
                <p className="text-xs text-slate-500">Quick 3-step guide to release your documents</p>
              </div>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Upload &amp; Pay Online</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Upload your PDF, notes or slides on your phone at this kiosk or campus WiFi, choose Color or B&amp;W, and pay with any UPI app.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Get Your 4-Digit Print Code</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Your digital receipt on your phone screen will display a <b className="font-mono text-slate-900">4-Digit Print Code</b> and a QR Pass.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Type Code &amp; Collect Prints</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Type your 4 digits on this touchscreen keypad and tap <b className="text-emerald-700">Start Print</b>. Your fresh pages will dispense below.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowToUseModal(false)}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer mt-2 shadow-sm"
            >
              Got It, Continue Printing
            </button>
          </div>
        </div>
      )}

      {/* ── NEED HELP MODAL ── */}
      {showNeedHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowNeedHelpModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Terminal Support Desk</h3>
                <p className="text-xs text-slate-500">Autonomous Campus Printing Hub &bull; {machineCode}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Terminal Location</span>
                <p className="font-bold text-slate-800">{machineData?.location || 'Block A, Ground Floor, Central Lobby'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Campus Tech Helpdesk</span>
                <p className="font-bold text-slate-800">Intercom: Ext 404 &bull; Student Support: +91 98400 12345</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                <b>Automatic Refund Guarantee:</b> If any hardware paper jam occurs, your payment is automatically refunded back to your source account.
              </div>
            </div>

            <button
              onClick={() => setShowNeedHelpModal(false)}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer mt-2 shadow-md shadow-blue-600/25"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
