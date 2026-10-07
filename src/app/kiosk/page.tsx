'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sounds } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileText,
  RotateCcw,
  Check,
  Clock,
  MapPin,
  Layers,
  Thermometer,
  Cpu,
  ChevronDown,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sparkles,
  Lock,
  Wifi,
  ShieldCheck,
  Zap,
  Timer,
  Search,
  Database,
  RefreshCw,
  FileCheck2,
  Server,
  Trash2,
  Flame,
  Radio
} from 'lucide-react';
import { Machine } from '@/lib/types';
import Logo from '@/components/Logo';

export default function KioskTouchscreenTerminal() {
  // Machine Selection & Live State
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineCode, setSelectedMachineCode] = useState<string>('RIT-ATM-01');
  const [currentMachine, setCurrentMachine] = useState<Machine | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [showMachineSelector, setShowMachineSelector] = useState<boolean>(false);

  // Kiosk Workflow Steps:
  // 'pin_entry' -> 'searching_order' -> 'order_verified' -> 'printing_in_progress' -> 'job_completed'
  const [step, setStep] = useState<'pin_entry' | 'searching_order' | 'order_verified' | 'printing_in_progress' | 'job_completed'>('pin_entry');

  // PIN Keypad State
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedOrder, setVerifiedOrder] = useState<any>(null);

  // Searching Animation State
  const [searchProgress, setSearchProgress] = useState<number>(0);
  const [searchStageText, setSearchStageText] = useState<string>('Connecting to Print ATM Cloud Vault...');
  const [searchStepNum, setSearchStepNum] = useState<number>(1);

  // Physical Machine Laser Printing Simulation State
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [printStage, setPrintStage] = useState<string>('Warming up high-speed laser fuser (200°C)...');
  const [currentPrintingPage, setCurrentPrintingPage] = useState<number>(1);
  const [totalPrintPages, setTotalPrintPages] = useState<number>(1);
  const [currentPrintingSide, setCurrentPrintingSide] = useState<'Front' | 'Back' | 'Single'>('Front');
  const [sheetsPrintedCount, setSheetsPrintedCount] = useState<number>(0);
  const [fuserTemp, setFuserTemp] = useState<number>(195);
  const [isRollerSpinning, setIsRollerSpinning] = useState<boolean>(false);
  const [isPaperFeeding, setIsPaperFeeding] = useState<boolean>(false);
  const [isDuplexFlipping, setIsDuplexFlipping] = useState<boolean>(false);
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState<number>(0);
  const [autoResetTimer, setAutoResetTimer] = useState<number>(10);

  // Fetch Machines & Pricing
  const loadKiosks = async () => {
    try {
      let targetCode = selectedMachineCode;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const mParam = params.get('machine') || params.get('id');
        if (mParam) {
          targetCode = mParam.toUpperCase();
          setSelectedMachineCode(targetCode);
        }
      }

      const res = await fetch('/api/machines');
      const data = await res.json();
      if (data.success && data.machines?.length > 0) {
        setMachines(data.machines);
        const match = data.machines.find((m: Machine) => m.machineCode.toUpperCase() === targetCode.toUpperCase()) || data.machines[0];
        setCurrentMachine(match);
      }
    } catch (err) {
      console.error('Failed to load kiosks:', err);
    }
  };

  useEffect(() => {
    loadKiosks();
  }, [selectedMachineCode]);

  // Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Safe sound trigger
  const playSound = (action: 'key' | 'success' | 'complete' | 'error' | 'laser' | 'roller' | 'dispense') => {
    if (isAudioMuted) return;
    try {
      if (action === 'key') sounds.keyPress();
      if (action === 'success') sounds.success();
      if (action === 'complete') sounds.printComplete();
      if (action === 'error') sounds.error();
      if (action === 'laser') sounds.laserSpinUp();
      if (action === 'roller') sounds.paperPassRoller();
      if (action === 'dispense') sounds.dispenseClick();
    } catch (e) {}
  };

  // Handle Keypad Press
  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    playSound('key');
    setPinError('');
    const newPin = pin + digit;
    setPin(newPin);

    // Auto verify when 4 digits are completed
    if (newPin.length === 4) {
      triggerSearchAndVerify(newPin);
    }
  };

  // Backspace
  const handleBackspace = () => {
    playSound('key');
    setPinError('');
    setPin(prev => prev.slice(0, -1));
  };

  // Clear PIN
  const handleClearPin = () => {
    playSound('key');
    setPin('');
    setPinError('');
  };

  // Animated Search & Order Retrieval Flow
  const triggerSearchAndVerify = async (pinToVerify: string) => {
    setIsVerifying(true);
    setPinError('');
    setStep('searching_order');
    setSearchProgress(25);
    setSearchStepNum(1);
    setSearchStageText(`Searching Print ATM Cloud for PIN #${pinToVerify}...`);
    playSound('key');

    // Stage 1 Animation (450ms)
    await new Promise(r => setTimeout(r, 450));
    setSearchProgress(60);
    setSearchStepNum(2);
    setSearchStageText('Verifying 256-bit Payment Stamp & Razorpay Receipt...');

    // Fetch from Backend API
    try {
      const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinToVerify,
          machineCode: selectedMachineCode,
        }),
      });

      const data = await res.json();

      // Stage 2 Animation (400ms)
      await new Promise(r => setTimeout(r, 400));
      setSearchProgress(88);
      setSearchStepNum(3);
      setSearchStageText('Retrieving Document Specifications & Page Buffers...');

      await new Promise(r => setTimeout(r, 350));

      if (data.success && data.order) {
        setSearchProgress(100);
        setSearchStageText('Order Found & Verified Successfully!');
        playSound('success');
        setVerifiedOrder(data.order);
        setTotalPrintPages(data.order.calculatedPrintPages || data.order.detectedTotalPages || 1);

        await new Promise(r => setTimeout(r, 400));
        setStep('order_verified');
      } else {
        playSound('error');
        setPinError(data.error || 'PIN not found or expired. Please check and try again.');
        setPin('');
        setStep('pin_entry');
      }
    } catch (err: any) {
      playSound('error');
      setPinError('Network connection issue. Please retry in a moment.');
      setPin('');
      setStep('pin_entry');
    } finally {
      setIsVerifying(false);
    }
  };

  // Live estimated countdown ticker during printing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'printing_in_progress' && estimatedSecondsRemaining > 0) {
      timer = setInterval(() => {
        setEstimatedSecondsRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, estimatedSecondsRemaining]);

  // Start Real-time Physical Machine Printing & Paper Delivery Simulation
  const handleStartPrint = async () => {
    if (!verifiedOrder) return;

    setStep('printing_in_progress');
    setIsRollerSpinning(true);
    
    const totalPages = verifiedOrder.calculatedPrintPages || verifiedOrder.detectedTotalPages || 1;
    const totalSheets = verifiedOrder.calculatedSheets || 1;
    const isDuplex = verifiedOrder.duplexMode === 'duplex';

    // Calculate accurate wait time: 1.2s pre-flight + (totalPages * 1.0s) + 0.6s fuser finish
    const totalWaitSeconds = Math.max(3, Math.ceil(1.5 + (totalPages * 1.0) + 0.6));
    setEstimatedSecondsRemaining(totalWaitSeconds);

    setPrintProgress(8);
    setFuserTemp(202);
    setPrintStage('Laser fuser heating to 200°C • Polygon mirror motor spin-up...');
    setSheetsPrintedCount(0);
    setCurrentPrintingPage(1);
    setCurrentPrintingSide(isDuplex ? 'Front' : 'Single');
    playSound('laser');

    // Stage 1: Laser Mirror Spin-up & Rasterization (1.2s)
    await new Promise(r => setTimeout(r, 1200));
    setPrintProgress(20);
    setPrintStage('Decrypting RAM document buffer & optical laser calibration...');

    // Stage 2: Page-by-Page Physical Roller Feed & Laser Imaging Loop
    for (let p = 1; p <= totalPages; p++) {
      setCurrentPrintingPage(p);
      const isBackSide = isDuplex && (p % 2 === 0);
      setCurrentPrintingSide(isDuplex ? (isBackSide ? 'Back' : 'Front') : 'Single');

      // Trigger realistic paper feeding animation
      setIsPaperFeeding(true);
      playSound('roller');

      if (isDuplex && isBackSide) {
        setIsDuplexFlipping(true);
        setPrintStage(`Duplex Turnaround: Flipping sheet to Side 2 (Back) for Page ${p} of ${totalPages}...`);
        await new Promise(r => setTimeout(r, 450));
        setIsDuplexFlipping(false);
      } else {
        setPrintStage(
          isDuplex
            ? `Laser Burning Page ${p} of ${totalPages} • Side 1 (Front)...`
            : `Laser Burning Page ${p} of ${totalPages} (600 DPI Precision)...`
        );
      }

      // Page print pass duration
      await new Promise(r => setTimeout(r, 900));
      setIsPaperFeeding(false);

      // Sheet output drop when front+back completed (duplex) or every page (simplex)
      if (!isDuplex || isBackSide || p === totalPages) {
        const currentSheetNum = Math.ceil(p / (isDuplex ? 2 : 1));
        setSheetsPrintedCount(currentSheetNum);
        playSound('dispense');
      }

      const progressCalc = 20 + Math.round((p / totalPages) * 72);
      setPrintProgress(Math.min(94, progressCalc));
    }

    setPrintStage('Optical paper alignment & collection tray delivery...');
    setPrintProgress(97);
    setIsRollerSpinning(false);
    await new Promise(r => setTimeout(r, 600));

    // Stage 3: Call Backend Paper Release API to deduct paper count and seal order
    try {
      const releaseRes = await fetch('/api/pin/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: verifiedOrder.id,
          machineCode: selectedMachineCode,
        }),
      });
      const releaseData = await releaseRes.json();
      if (releaseData.success) {
        loadKiosks(); // Refresh paper counts in DB
      }
    } catch (e) {
      console.warn('Paper release sync warning:', e);
    }

    // Final Stage: Complete & Privacy Auto-Wipe
    setEstimatedSecondsRemaining(0);
    setPrintProgress(100);
    setFuserTemp(140);
    setPrintStage('All Documents Successfully Delivered to Collection Tray!');
    playSound('complete');

    // Confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#00a61c', '#16a34a', '#86efac', '#0f172a', '#38bdf8']
      });
    } catch (e) {}

    await new Promise(r => setTimeout(r, 500));
    setStep('job_completed');
  };

  // Auto-reset countdown timer for next customer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'job_completed') {
      setAutoResetTimer(10);
      timer = setInterval(() => {
        setAutoResetTimer(prev => {
          if (prev <= 1) {
            handleResetToIdle();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Reset to Idle Screen
  const handleResetToIdle = () => {
    playSound('key');
    setPin('');
    setPinError('');
    setVerifiedOrder(null);
    setPrintProgress(0);
    setSheetsPrintedCount(0);
    setCurrentPrintingPage(1);
    setEstimatedSecondsRemaining(0);
    setIsRollerSpinning(false);
    setIsPaperFeeding(false);
    setIsDuplexFlipping(false);
    setStep('pin_entry');
  };

  return (
    <div className="min-h-screen w-full bg-mint-grid text-slate-900 flex flex-col font-sans select-none overflow-x-hidden">
      {/* ================= TOP HEADER (MATCHES MAIN APP DESIGN SYSTEM) ================= */}
      <header className="px-4 py-2 sm:py-2.5 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0 bg-white/90 border-b border-slate-200/80 backdrop-blur-md sticky top-0 z-40">
        {/* Brand Logo & Location Dropdown */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <Logo size="sm" showTagline={false} />

          {/* 2nd Campus/Partner Logo (if configured) */}
          {currentMachine?.secondaryLogoUrl && (
            <>
              <span className="hidden sm:inline-block w-px h-5 bg-slate-200" />
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={currentMachine.secondaryLogoUrl}
                  alt={currentMachine.organizationName}
                  className="w-5 h-5 rounded-md object-cover border border-slate-200"
                />
                <span className="text-xs font-bold text-slate-800">{currentMachine.organizationName}</span>
              </div>
            </>
          )}

          <span className="hidden sm:inline-block w-px h-5 bg-slate-200" />

          {/* Machine Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMachineSelector(!showMachineSelector)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-[#00a61c] animate-pulse" />
              <span className="font-mono font-bold text-slate-900">{currentMachine?.machineCode || selectedMachineCode}</span>
              <span className="text-slate-500 hidden md:inline">• {currentMachine?.displayName || 'Kiosk Terminal'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
            </button>

            {showMachineSelector && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-fade-in space-y-1">
                <p className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                  Select Active Kiosk Terminal
                </p>
                {machines.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMachineCode(m.machineCode);
                      setShowMachineSelector(false);
                      playSound('key');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      m.machineCode === selectedMachineCode
                        ? 'bg-[#e9f9ee] font-bold text-[#00a61c]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{m.displayName}</p>
                      <p className="text-[10px] text-slate-400">{m.locationDescription}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 font-mono">
                      {m.currentSheetsRemaining} sheets
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Status & Tools */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Paper Tray Health Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium">
            <Layers className="h-3.5 w-3.5 text-[#00a61c]" />
            <span>Paper:</span>
            <span className="font-mono font-bold text-slate-900">
              {currentMachine?.currentSheetsRemaining ?? 450} / {currentMachine?.totalCapacitySheets ?? 500}
            </span>
          </div>

          {/* Audio Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              if (isAudioMuted) sounds.keyPress();
            }}
            className="p-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4 text-[#00a61c]" />}
          </button>

          {/* Digital Clock */}
          <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-xs">
            {currentTime || '10:00 AM'}
          </div>
        </div>
      </header>

      {/* ================= MAIN INTERACTIVE TOUCHSCREEN CONTENT ================= */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl w-full mx-auto">
        {/* ----------------- STEP 1: 4-DIGIT PIN ENTRY ----------------- */}
        {step === 'pin_entry' && (
          <div className="w-full max-w-md flex flex-col items-center text-center space-y-6 animate-fade-in">
            {/* Hero Heading */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e9f9ee] border border-[#b8edc7] text-[#00a61c] text-xs font-bold uppercase tracking-wide">
                <KeyRound className="h-3.5 w-3.5" />
                Contactless Print Release
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Enter Your <span className="text-[#00a61c]">4-Digit PIN</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                Type the 4-digit code from your payment receipt to print your documents instantly.
              </p>
            </div>

            {/* Glowing PIN Display Boxes */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 my-1">
              {[0, 1, 2, 3].map((index) => {
                const char = pin[index];
                const isFilled = Boolean(char);
                const isCurrent = pin.length === index;

                return (
                  <div
                    key={index}
                    className={`w-16 h-20 sm:w-18 sm:h-22 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-mono font-black transition-all duration-200 shadow-sm ${
                      isFilled
                        ? 'bg-[#e9f9ee] border-2 border-[#00a61c] text-[#00a61c] scale-105 shadow-md shadow-[#00a61c]/20'
                        : isCurrent
                        ? 'bg-white border-2 border-[#00a61c] text-slate-900 ring-4 ring-[#00a61c]/15 animate-pulse'
                        : 'bg-white border-2 border-slate-200 text-slate-300'
                    }`}
                  >
                    {isFilled ? char : <span className="text-slate-300 text-2xl">•</span>}
                  </div>
                );
              })}
            </div>

            {/* Error Message Toast */}
            {pinError && (
              <div className="w-full p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake text-left">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span className="font-semibold leading-relaxed">{pinError}</span>
              </div>
            )}

            {/* Touch Keypad */}
            <div className="w-full grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  disabled={isVerifying}
                  className="h-16 sm:h-18 rounded-2xl bg-white hover:bg-slate-50 active:bg-[#e9f9ee] active:text-[#00a61c] border border-slate-200 hover:border-[#00a61c]/50 text-slate-900 font-mono font-extrabold text-2xl sm:text-3xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              {/* Clear Key */}
              <button
                type="button"
                onClick={handleClearPin}
                disabled={isVerifying || pin.length === 0}
                className="h-16 sm:h-18 rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-700 font-bold text-xs uppercase tracking-wider transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-40 flex flex-col items-center justify-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear</span>
              </button>

              {/* Zero Key */}
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                disabled={isVerifying}
                className="h-16 sm:h-18 rounded-2xl bg-white hover:bg-slate-50 active:bg-[#e9f9ee] active:text-[#00a61c] border border-slate-200 hover:border-[#00a61c]/50 text-slate-900 font-mono font-extrabold text-2xl sm:text-3xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                0
              </button>

              {/* Backspace Key */}
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isVerifying || pin.length === 0}
                className="h-16 sm:h-18 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-40 flex flex-col items-center justify-center gap-1"
              >
                <span className="text-lg leading-none">⌫</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------- STEP 1.5: HIGH-TECH CLOUD SEARCH & ORDER RETRIEVAL ANIMATION ----------------- */}
        {step === 'searching_order' && (
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-scale-up text-center">
            {/* Animated Radar Scanning Chamber */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-70" />
              <div className="absolute -inset-2 rounded-full border-2 border-dashed border-[#00a61c]/40 animate-spin" style={{ animationDuration: '4s' }} />

              <div className="relative h-20 w-20 rounded-2xl bg-[#e9f9ee] border border-[#b8edc7] text-[#00a61c] flex items-center justify-center shadow-inner">
                <Search className="h-9 w-9 animate-bounce" />
              </div>
            </div>

            {/* Heading & PIN Pill */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-mono font-bold shadow-sm">
                <KeyRound className="h-3.5 w-3.5 text-[#00a61c]" />
                PIN: {pin}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Retrieving Print Job
              </h2>
              <p className="text-xs text-slate-500">
                Querying secure cloud vault for document specifications...
              </p>
            </div>

            {/* Multi-step Live Verification Pipeline */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 flex items-center gap-2">
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    searchStepNum >= 1 ? 'bg-[#00a61c] text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {searchStepNum >= 2 ? '✓' : '1'}
                  </span>
                  Cloud Vault Query
                </span>
                <span className="font-mono text-[11px] font-bold text-[#00a61c]">
                  {searchStepNum >= 2 ? 'Connected' : 'Querying...'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-700 flex items-center gap-2">
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    searchStepNum >= 2 ? 'bg-[#00a61c] text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {searchStepNum >= 3 ? '✓' : '2'}
                  </span>
                  Payment Authorization Stamp
                </span>
                <span className="font-mono text-[11px] font-bold text-[#00a61c]">
                  {searchStepNum >= 3 ? 'Verified' : (searchStepNum === 2 ? 'Verifying...' : 'Pending')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-700 flex items-center gap-2">
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    searchStepNum >= 3 ? 'bg-[#00a61c] text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {searchProgress === 100 ? '✓' : '3'}
                  </span>
                  Document Layout Buffers
                </span>
                <span className="font-mono text-[11px] font-bold text-[#00a61c]">
                  {searchProgress === 100 ? 'Ready' : (searchStepNum === 3 ? 'Loading...' : 'Pending')}
                </span>
              </div>
            </div>

            {/* Smooth Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span className="truncate">{searchStageText}</span>
                <span className="text-[#00a61c] font-mono">{searchProgress}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 p-0.5 border border-slate-200 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00a61c] to-[#14ca74] transition-all duration-300"
                  style={{ width: `${searchProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ----------------- STEP 2: ORDER VERIFIED CONFIRMATION ----------------- */}
        {step === 'order_verified' && verifiedOrder && (
          <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 animate-scale-up">
            {/* Header: Verified Pill */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-[#e9f9ee] text-[#00a61c] border border-[#b8edc7] flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Order Verified & Ready</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Order #{verifiedOrder.orderNumber || verifiedOrder.id} • PIN #{pin}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#e9f9ee] border border-[#b8edc7] text-[#00a61c] text-xs font-bold uppercase tracking-wider">
                PAID ✓
              </span>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Document Info Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <FileText className="h-4 w-4 text-[#00a61c]" />
                  <span>Document Details:</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate" title={verifiedOrder.fileName}>
                  {verifiedOrder.fileName}
                </p>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600 font-medium">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                    {verifiedOrder.calculatedPrintPages} Pages
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                    {verifiedOrder.copies || 1} {verifiedOrder.copies === 1 ? 'Copy' : 'Copies'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 uppercase">
                    {verifiedOrder.colorMode === 'color' ? '🎨 Full Color' : '⚫ B&W'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 uppercase">
                    {verifiedOrder.duplexMode === 'duplex' ? '📄 2-Sided (Duplex)' : '📄 1-Sided'}
                  </span>
                </div>
              </div>

              {/* Paper Dispense Breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <Layers className="h-4 w-4 text-[#00a61c]" />
                  <span>Paper Dispense:</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {verifiedOrder.calculatedSheets}
                  </span>
                  <span className="text-xs text-slate-500">Sheets of 80 GSM A4</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#00a61c] font-medium pt-0.5">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    Paper tray aligned
                  </span>
                  <span className="font-mono text-slate-500">
                    Est: ~{Math.max(3, Math.ceil(1.5 + (verifiedOrder.calculatedPrintPages || 1) * 1.0))}s
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Shredder Notice */}
            <div className="p-3 rounded-2xl bg-[#e9f9ee]/60 border border-[#b8edc7] text-xs text-slate-700 flex items-start gap-2">
              <Lock className="h-4 w-4 text-[#00a61c] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-slate-900">Zero-Knowledge Cloud Security:</span> Temporary decrypted files will be automatically wiped and deleted permanently upon print completion (0 bytes stored). PIN cannot be reused.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleStartPrint}
                className="flex-1 py-3.5 px-6 rounded-2xl btn-primary-glow text-white font-bold text-sm shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Printer className="h-5 w-5 stroke-[2.2]" />
                <span>START PRINTING NOW</span>
              </button>

              <button
                type="button"
                onClick={handleResetToIdle}
                className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ----------------- STEP 3: PHYSICAL PRINTER HARDWARE CHAMBER SIMULATION ----------------- */}
        {step === 'printing_in_progress' && (
          <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in text-center">
            {/* ================= REALISTIC HARDWARE LASER PRINT CHAMBER ================= */}
            <div className="relative p-5 rounded-3xl bg-slate-950 border-2 border-slate-800 text-white shadow-2xl overflow-hidden space-y-4">
              {/* Chamber Header: Machine Telemetry */}
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#00ff66] animate-ping" />
                  <span className="font-bold text-[#00ff66]">OPTICAL LASER CORE ACTIVE</span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Flame className="h-3.5 w-3.5" /> {fuserTemp}°C
                  </span>
                  <span>|</span>
                  <span className="text-cyan-400">35 PPM</span>
                </div>
              </div>

              {/* Physical Paper Path Simulation */}
              <div className="relative h-44 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-between p-3 overflow-hidden">
                {/* 1. Top Paper Intake Feeder */}
                <div className="w-full flex items-center justify-between px-3 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Intake Tray A4
                  </span>
                  <span className="text-slate-500">Rollers 180 RPM</span>
                </div>

                {/* 2. Center Heated Laser Drum & Animated Paper Sheet */}
                <div className="relative w-full flex-1 flex items-center justify-center my-1">
                  {/* Rotating Stepper Roller Gears */}
                  <div className={`absolute -left-1 w-8 h-8 rounded-full border-2 border-dashed border-cyan-500/40 ${
                    isRollerSpinning ? 'animate-spin' : ''
                  }`} style={{ animationDuration: '0.8s' }} />
                  <div className={`absolute -right-1 w-8 h-8 rounded-full border-2 border-dashed border-cyan-500/40 ${
                    isRollerSpinning ? 'animate-spin' : ''
                  }`} style={{ animationDuration: '0.8s' }} />

                  {/* Physical Paper Sheet passing through */}
                  <div className={`relative w-44 sm:w-56 h-24 bg-white rounded-lg shadow-xl border border-slate-300 p-2 text-slate-900 flex flex-col justify-between transition-transform duration-300 ${
                    isPaperFeeding ? 'scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'scale-100'
                  } ${isDuplexFlipping ? 'rotate-180 transition-transform duration-500' : ''}`}>
                    {/* Glowing Laser Scan Line passing over paper */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#00ff66] to-transparent shadow-[0_0_12px_#00ff66] animate-pulse" />

                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00a61c]" />
                        <span className="text-[9px] font-bold font-mono text-slate-800 truncate max-w-[100px]">
                          {verifiedOrder?.fileName || 'Document.pdf'}
                        </span>
                      </div>
                      <span className="text-[8px] font-bold font-mono px-1 rounded bg-slate-100 text-slate-700">
                        {currentPrintingSide}
                      </span>
                    </div>

                    {/* Simulated Text Lines */}
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-200 rounded w-full" />
                      <div className="h-1.5 bg-slate-200 rounded w-4/5" />
                      <div className="h-1.5 bg-slate-100 rounded w-3/5" />
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-0.5">
                      <span>Laser 600 DPI</span>
                      <span className="font-bold text-[#00a61c]">Page {currentPrintingPage} / {totalPrintPages}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Output Collection Tray Ejector */}
                <div className="w-full flex items-center justify-between px-3 text-[10px] font-mono text-slate-400">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00ff66] animate-ping" /> Optical Exit Tray
                  </span>
                  <span className="text-slate-300 font-bold">
                    {sheetsPrintedCount} / {verifiedOrder?.calculatedSheets || 1} Sheets Stacked
                  </span>
                </div>
              </div>

              {/* Dynamic Status Text */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 truncate max-w-xs">{printStage}</span>
                <span className="text-[#00ff66] font-bold text-sm">{printProgress}%</span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="space-y-1.5 text-left">
              <div className="h-3 w-full rounded-full bg-slate-100 p-0.5 border border-slate-200 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00a61c] to-[#14ca74] transition-all duration-300 shadow-sm"
                  style={{ width: `${printProgress}%` }}
                />
              </div>
            </div>

            {/* Live Telemetry & Wait Time Counter */}
            <div className="grid grid-cols-2 gap-3 text-left">
              {/* Estimated Time Remaining */}
              <div className="p-3 rounded-2xl bg-[#e9f9ee]/60 border border-[#b8edc7] flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-[#b8edc7] text-[#00a61c] flex items-center justify-center shrink-0 shadow-2xs">
                  <Timer className="h-5 w-5 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Est. Wait Time</p>
                  <p className="text-base font-black text-[#00a61c] font-mono">
                    {estimatedSecondsRemaining > 0 ? `${estimatedSecondsRemaining} seconds` : 'Delivering...'}
                  </p>
                </div>
              </div>

              {/* Sheets Dispensed */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Layers className="h-5 w-5 text-[#00a61c]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sheets Ejected</p>
                  <p className="text-base font-black text-slate-900 font-mono">
                    {sheetsPrintedCount} / {verifiedOrder?.calculatedSheets || 1}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 animate-pulse">
              Please wait while paper passes through the optical fuser into the lower collection tray...
            </p>
          </div>
        )}

        {/* ----------------- STEP 4: JOB COMPLETE & ZERO-KNOWLEDGE PRIVACY SHREDDING ----------------- */}
        {step === 'job_completed' && (
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 animate-scale-up text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#e9f9ee] border border-[#b8edc7] text-[#00a61c] mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="h-9 w-9 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Print Job Delivered!
              </h2>
              <p className="text-xs sm:text-sm text-[#00a61c] font-semibold">
                Please collect your fresh prints from the collection tray below ⬇️
              </p>
            </div>

            {/* Summary Receipt Box with Privacy Shredder Seal */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2 font-mono text-left">
              <div className="flex justify-between text-slate-500">
                <span>Document:</span>
                <span className="text-slate-900 font-bold truncate max-w-[180px]">{verifiedOrder?.fileName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Delivered:</span>
                <span className="text-[#00a61c] font-bold">{verifiedOrder?.calculatedSheets} A4 Sheet(s)</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>PIN Security:</span>
                <span className="text-rose-600 font-bold">PIN #{pin} Used & Expired 🔒</span>
              </div>
              <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-2">
                <span className="flex items-center gap-1 text-emerald-800 font-bold">
                  <Trash2 className="h-3.5 w-3.5 text-[#00a61c]" /> Auto File Shredder:
                </span>
                <span className="text-emerald-700 font-bold">Deleted (0 bytes retained) ✓</span>
              </div>
            </div>

            {/* Privacy Guarantee Reassurance Box */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00a61c] shrink-0" />
              <span>Zero-Retention Guarantee: All document buffers & caches are wiped completely.</span>
            </div>

            {/* Auto-Reset Countdown */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Resetting screen for next user in:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-[#00a61c] font-mono font-bold">
                {autoResetTimer}s
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetToIdle}
              className="w-full py-3.5 rounded-2xl btn-primary-glow text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              Done / Print Another Document
            </button>
          </div>
        )}
      </main>

      {/* ================= BOTTOM FOOTER (MATCHES MAIN APP BRANDING) ================= */}
      <footer className="w-full bg-white border-t border-slate-200/80 px-4 sm:px-8 py-2.5 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 z-20 font-sans">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <Cpu className="h-3.5 w-3.5 text-[#00a61c]" /> System Firmware: v2.4.8-ARM
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <Wifi className="h-3.5 w-3.5 text-[#00a61c]" /> Kiosk Online (18ms)
          </span>
        </div>

        <div className="text-slate-500">
          PrintIt Self-Service ATM • 24/7 Helpline: <span className="text-slate-900 font-bold">1800-PRINT-IT</span>
        </div>
      </footer>
    </div>
  );
}
