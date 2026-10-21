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
  AlertTriangle,
  KeyRound,
  Delete,
} from 'lucide-react';

// Streamlined Autonomous Kiosk Navigation Screens
type KioskScreen = 
  | 'ready_to_scan' 
  | 'enter_pin' 
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

  // 4-Digit PIN Input State
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

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

  // Security Alert for Already Scanned / Expired Passes
  const [scanAlert, setScanAlert] = useState<{
    type: string;
    orderNumber?: string;
    fileName?: string;
    message: string;
    tamilMessage?: string;
  } | null>(null);

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
    setScanAlert(null);
    setScanError(null);
    setEnteredPin('');
    setPinError(null);
    setIsVerifyingPin(false);
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
        clearScanAlert: true,
      }),
    }).catch(() => {});
  };

  // ── PIN KEYPAD HANDLERS ──
  const handleDigitPress = (digit: string) => {
    if (enteredPin.length < 4) {
      playTouchTone(700 + enteredPin.length * 90);
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setPinError(null);
      if (newPin.length === 4) {
        verifyEnteredPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    playTouchTone(600);
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClearPin = () => {
    playTouchTone(500);
    setEnteredPin('');
    setPinError(null);
  };

  const verifyEnteredPin = async (pinToVerify?: string) => {
    const pinCode = pinToVerify || enteredPin;
    if (!pinCode || pinCode.length !== 4) {
      setPinError('Please enter a 4-digit PIN');
      playTouchTone(220, 0.3);
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinCode,
          machineCode,
        }),
      });

      const data = await res.json();
      setIsVerifyingPin(false);

      if (!data.success) {
        if (data.alreadyUsed || data.error?.includes('already been used') || data.error?.includes('already been printed') || data.error?.includes('fulfilled')) {
          setScanAlert({
            type: 'ALREADY_USED',
            orderNumber: data.order?.order_number || data.order?.orderNumber,
            fileName: data.order?.file_name || data.order?.fileName,
            message: data.error,
            tamilMessage: 'இந்த PIN ஏற்கனவே பயன்படுத்தப்பட்டுவிட்டது! மறுமுறை பயன்படுத்த முடியாது.',
          });
          playTouchTone(220, 0.4);
          setTimeout(() => setScanAlert(null), 7000);
          return;
        }
        setPinError(data.error || 'Invalid PIN. Please check your mobile receipt.');
        playTouchTone(220, 0.3);
        return;
      }

      // Order Found & Authenticated!
      setActiveOrder(data.order);
      setPinError(null);
      setScanAlert(null);
      setCurrentScreen('order_details');
      playTouchTone(1320, 0.25);
      setAutoPrintCountdown(3);
    } catch {
      setIsVerifyingPin(false);
      setPinError('Connection error verifying PIN. Please try again.');
      playTouchTone(220, 0.3);
    }
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
        if (data.alreadyUsed || data.error?.includes('already been used') || data.error?.includes('already been printed') || data.error?.includes('fulfilled')) {
          setScanAlert({
            type: 'ALREADY_USED',
            orderNumber: data.order?.order_number || data.order?.orderNumber,
            fileName: data.order?.file_name || data.order?.fileName,
            message: data.error,
            tamilMessage: 'இந்த QR பாஸ் ஏற்கனவே பிரிண்ட் செய்யப்பட்டு விட்டது! மறுமுறை பயன்படுத்த முடியாது.',
          });
          playTouchTone(220, 0.4);
          setTimeout(() => setScanAlert(null), 7000);
          return;
        }
        setScanError(data.error || 'Invalid QR Pass. Please check your mobile receipt.');
        playTouchTone(220, 0.3);
        return;
      }

      // Order Found & Authenticated!
      setActiveOrder(data.order);
      setIsVerifyingOrder(false);
      setScanError(null);
      setScanAlert(null);
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

  // USB Barcode Scanner & Physical Keypad Listener
  useEffect(() => {
    if (currentScreen !== 'ready_to_scan' && currentScreen !== 'enter_pin') {
      barcodeBufferRef.current = '';
      if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. If on enter_pin screen, support typing PIN via keyboard
      if (currentScreen === 'enter_pin') {
        if (/^[0-9]$/.test(e.key)) {
          handleDigitPress(e.key);
        } else if (e.key === 'Backspace') {
          handleBackspace();
        } else if (e.key === 'Enter') {
          verifyEnteredPin();
        } else if (e.key === 'Escape') {
          resetToReady();
        }
        return;
      }

      // 2. If on ready_to_scan, capture USB scanner keystrokes or shortcut to PIN screen
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
  }, [currentScreen, handleScannedQrData, enteredPin]);

  // ── LIVE SERVER-SYNCED SCAN LISTENER (Captures Pi Hardware Scans Instantly) ──
  const lastProcessedOrderIdRef = useRef<string>('');

  useEffect(() => {
    if (currentScreen !== 'ready_to_scan') return;

    const syncTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/kiosk/state?machineCode=${machineCode}`, { cache: 'no-store' });
        const data = await res.json();

        // 1. Check for Already-Used / Security Scan Alert from Pi hardware scan
        if (data.success && data.scanAlert && currentScreen === 'ready_to_scan') {
          playTouchTone(220, 0.4);
          setScanAlert(data.scanAlert);
          setTimeout(() => {
            setScanAlert(null);
            fetch('/api/kiosk/state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ machineCode, clearScanAlert: true }),
            }).catch(() => {});
          }, 7000);
        }

        // 2. Check for active valid order release
        if (data.success && data.activeOrder && currentScreen === 'ready_to_scan') {
          const ord = data.activeOrder;
          if (ord.id && ord.id !== lastProcessedOrderIdRef.current) {
            lastProcessedOrderIdRef.current = ord.id;
            playTouchTone(1320, 0.25);
            setScanAlert(null);
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

    // 1. Immediately enqueue job to Raspberry Pi daemon (only if not already printing)
    try {
      if (activeOrder?.orderStatus !== 'printing') {
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
      }
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
            <div className="w-full max-w-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[28px] p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.9)] flex flex-col items-center text-center space-y-3 relative overflow-hidden animate-in fade-in duration-200">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />

              {/* Status Header Badge + Title in a clean compact header */}
              <div className="flex flex-col items-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="font-mono font-black">Optical Scanner Active &bull; Ready to Scan</span>
                </div>

                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                    Release Your Print Job
                  </h1>
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span className="font-mono">{typedText}</span>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-500 font-medium max-w-md mx-auto leading-tight">
                  Hold mobile <span className="text-blue-600 font-bold">QR Pass</span> to scanner lens or tap <span className="text-indigo-600 font-bold">Enter PIN</span> below.
                </p>
              </div>

              {/* 2 Interactive Release Options Side-by-Side: QR Scanner vs Touch PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                
                {/* OPTION A: Optical QR Scanner Box */}
                <div className="p-3 rounded-2xl bg-gradient-to-b from-blue-50/70 to-indigo-50/40 border border-blue-200/80 flex flex-col items-center justify-between text-center relative group">
                  <div className="text-left w-full flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-blue-600 text-white font-black text-[9px] flex items-center justify-center">1</div>
                      <span className="text-xs font-black text-slate-800">Scan QR Code</span>
                    </div>
                    <span className="text-[9px] font-mono text-blue-600 font-bold bg-blue-100/70 px-2 py-0.5 rounded-full">Touchless</span>
                  </div>

                  {/* Scanner Target Frame */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border-2 border-blue-300 flex flex-col items-center justify-center relative shadow-xs overflow-hidden my-1">
                    {/* Corners */}
                    <div className="absolute inset-2 border border-dashed border-blue-400/50 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-blue-600 rounded-tl" />
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-blue-600 rounded-tr" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-blue-600 rounded-bl" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-blue-600 rounded-br" />

                      {/* Animated Laser Beam */}
                      <div className="absolute inset-x-1 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-md shadow-blue-500/80 animate-bounce duration-1000 opacity-90" />

                      <div className="flex flex-col items-center justify-center space-y-0.5 opacity-80 group-hover:scale-105 transition-transform">
                        <QrCode className="h-11 w-11 text-blue-600 stroke-[1.5] animate-pulse" />
                        <span className="text-[8px] font-mono font-bold text-blue-700 uppercase tracking-widest">
                          Hold Pass Here
                        </span>
                      </div>
                    </div>

                    {/* Verification Spinner */}
                    {isVerifyingOrder && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-1 z-10 animate-fade-in">
                        <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                        <span className="text-[9px] font-bold text-slate-800">Verifying Pass...</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] font-mono text-slate-500 font-semibold">
                    Distance: 10cm - 15cm from scanner
                  </span>
                </div>

                {/* OPTION B: Touchscreen 4-Digit PIN Keypad Entry */}
                <div className="p-3 rounded-2xl bg-gradient-to-b from-indigo-50/60 to-purple-50/40 border border-indigo-200/80 flex flex-col items-center justify-between text-center relative group">
                  <div className="text-left w-full flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-indigo-600 text-white font-black text-[9px] flex items-center justify-center">2</div>
                      <span className="text-xs font-black text-slate-800">Enter 4-Digit PIN</span>
                    </div>
                    <span className="text-[9px] font-mono text-indigo-600 font-bold bg-indigo-100/70 px-2 py-0.5 rounded-full">Touchscreen</span>
                  </div>

                  {/* Big Touchscreen Action Icon & Info */}
                  <div className="my-auto w-full py-1.5 flex flex-col items-center justify-center space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 flex items-center justify-center shadow-sm">
                      <KeyRound className="w-5 h-5 text-slate-900 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-slate-800">No QR Code with you?</span>
                      <span className="block text-[10px] text-slate-500">Tap below to enter your mobile PIN on screen</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playTouchTone(800);
                      setEnteredPin('');
                      setPinError(null);
                      setCurrentScreen('enter_pin');
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-between shadow-md shadow-blue-500/20 transition-all cursor-pointer group"
                  >
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                      Type PIN On Screen
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>

              {/* Security Alert: Already Used / Printed Pass */}
              {scanAlert && (
                <div className="w-full max-w-lg p-2.5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-md flex flex-col items-center text-center space-y-1 animate-in zoom-in-95 duration-150 z-30">
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-black text-rose-950">
                      QR பாஸ் ஏற்கனவே பயன்படுத்தப்பட்டுவிட்டது!
                    </h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-rose-700 leading-tight">
                    {scanAlert.tamilMessage || 'இந்த QR பாஸ் ஏற்கனவே பிரிண்ட் செய்யப்பட்டு விட்டது! மறுமுறை பயன்படுத்த முடியாது.'}
                  </p>
                  <button
                    onClick={() => setScanAlert(null)}
                    className="text-[10px] font-bold text-rose-600 underline hover:text-rose-800 cursor-pointer pt-0.5"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Error Alert if any */}
              {scanError && !scanAlert && (
                <div className="w-full max-w-md p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* 3 Step Touchless Guide - Ultra-compact horizontal row */}
              <div className="grid grid-cols-3 gap-2 w-full text-left">
                <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-blue-100 text-blue-700 font-black text-[9px] flex items-center justify-center shrink-0">1</div>
                  <span className="text-[10px] font-semibold text-slate-700 truncate">Mobile QR / PIN</span>
                </div>
                <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-blue-100 text-blue-700 font-black text-[9px] flex items-center justify-center shrink-0">2</div>
                  <span className="text-[10px] font-semibold text-slate-700 truncate">Scan or Keypad</span>
                </div>
                <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-700 font-black text-[9px] flex items-center justify-center shrink-0">3</div>
                  <span className="text-[10px] font-semibold text-slate-700 truncate">Instant Kyocera Print</span>
                </div>
              </div>

              {/* Discreet Demo Helper */}
              <div className="w-full pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Kyocera MFP Ready (Duplex A4)</span>
                </div>
                <button
                  onClick={handleSimulateQuickScan}
                  className="text-[9px] font-mono text-slate-400 hover:text-blue-600 underline cursor-pointer"
                  title="Simulate scanning a demo pass"
                >
                  Test Demo Pass &rarr;
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN: ENTER 4-DIGIT PIN (ATM TOUCHSCREEN KEYPAD)              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {currentScreen === 'enter_pin' && (
            <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[32px] p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.1),0_0_0_1px_rgba(255,255,255,0.9)] flex flex-col items-center text-center space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-blue-600 to-indigo-600" />

              {/* Top Navigation Row */}
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => {
                    playTouchTone(600);
                    resetToReady();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Scan</span>
                </button>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>PIN Release Mode</span>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Enter 4-Digit Print PIN
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Type the 4-digit code shown on your mobile screen
                </p>
              </div>

              {/* 4-Box PIN Display */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const digit = enteredPin[idx];
                  const isCurrent = idx === enteredPin.length;
                  return (
                    <div
                      key={idx}
                      className={`w-14 h-16 sm:w-16 sm:h-18 rounded-2xl border-2 flex items-center justify-center text-3xl font-mono font-black transition-all ${
                        digit
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm scale-105'
                          : isCurrent
                          ? 'border-blue-500 bg-white ring-4 ring-blue-100 text-slate-300 animate-pulse'
                          : 'border-slate-200 bg-slate-50 text-slate-300'
                      }`}
                    >
                      {digit ? digit : isCurrent ? '_' : '•'}
                    </div>
                  );
                })}
              </div>

              {/* Pin Error Notification */}
              {pinError && (
                <div className="w-full p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* Touchscreen ATM Keypad Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[290px] sm:max-w-[310px] w-full mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitPress(digit)}
                    disabled={isVerifyingPin}
                    className="h-12 sm:h-13 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-blue-100/60 border border-slate-200 hover:border-slate-300 text-2xl font-mono font-black text-slate-800 shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 select-none"
                  >
                    {digit}
                  </button>
                ))}

                {/* Clear Button */}
                <button
                  type="button"
                  onClick={handleClearPin}
                  disabled={isVerifyingPin || enteredPin.length === 0}
                  className="h-12 sm:h-13 rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-40 select-none"
                >
                  Clear
                </button>

                {/* 0 Button */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  disabled={isVerifyingPin}
                  className="h-12 sm:h-13 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-blue-100/60 border border-slate-200 hover:border-slate-300 text-2xl font-mono font-black text-slate-800 shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 select-none"
                >
                  0
                </button>

                {/* Backspace Button */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isVerifyingPin || enteredPin.length === 0}
                  className="h-12 sm:h-13 rounded-2xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 text-amber-800 text-sm font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-40 select-none"
                  title="Delete"
                >
                  <Delete className="w-5 h-5 text-amber-800" />
                </button>
              </div>

              {/* Verify & Start Print Action Button */}
              <button
                type="button"
                onClick={() => verifyEnteredPin()}
                disabled={isVerifyingPin || enteredPin.length !== 4}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isVerifyingPin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying PIN...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Start Print</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
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
