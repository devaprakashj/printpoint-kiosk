'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, Zap, ShieldCheck, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, Eye, Volume2, Sparkles, RefreshCw } from 'lucide-react';

interface ConfigStep {
  step: number;
  id: string;
  title: string;
  subtitle: string;
  code: string;
  image: string;
  badge: string;
  badgeColor: string;
  instruction: string;
  tamilInstruction: string;
}

const STEPS: ConfigStep[] = [
  {
    step: 1,
    id: 'unlock',
    title: 'Unlock Config Mode',
    subtitle: 'Scan Code Configuration: ON',
    code: '~M00910001.',
    image: '/v3_unlock.png',
    badge: 'MANDATORY FIRST STEP',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    instruction: 'Scanner will beep once. All subsequent setting codes are now accepted.',
    tamilInstruction: 'முதலில் இதை ஸ்கேன் செய்யுங்கள். ஒரு Beep சத்தம் வரும். செட்டிங் மோட் ஓபன் ஆகும்.'
  },
  {
    step: 2,
    id: 'induction_mode',
    title: 'Enable Auto-Sensing Mode (Hands-Free)',
    subtitle: 'System Working Mode: Induction / Auto-Sense',
    code: '~M00210002.',
    image: '/v3_induction_mode.png',
    badge: 'HANDS-FREE AUTO SCAN',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    instruction: 'Scanner will automatically detect mobile phone screens and QR codes hands-free without pressing any button!',
    tamilInstruction: 'இதை ஸ்கேன் செய்தால் ஸ்கேனர் ஆட்டோ-சென்சிங் மோடுக்கு மாறும். பட்டன் அழுத்தாமல் போனை காட்டினால் உடனே ஸ்கேன் செய்யும்!'
  },
  {
    step: 3,
    id: 'white_off',
    title: 'Turn OFF White Floodlight',
    subtitle: 'Fill Light Continuous: Level 0 (0% OFF)',
    code: '~M01030000.',
    image: '/v3_white_led_off.png',
    badge: 'SHUTS OFF WHITE LED',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    instruction: 'White LED light turns off immediately upon scanning!',
    tamilInstruction: 'இதை ஸ்கேன் செய்த உடனேயே வெள்ளை நிற எல்.இ.டி லைட் அணைந்துவிடும்!'
  },
  {
    step: 4,
    id: 'red_off',
    title: 'Turn OFF Red Laser',
    subtitle: 'Aiming Light: Shut Down',
    code: '~M01050000.',
    image: '/v3_red_laser_off.png',
    badge: 'SHUTS OFF RED LASER',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    instruction: 'Red aiming laser line shuts off completely.',
    tamilInstruction: 'இதை ஸ்கேன் செய்தால் சிவப்பு நிற லேசர் கோடும் அணைந்துவிடும்.'
  },
  {
    step: 5,
    id: 'disable_1d',
    title: 'Disable 1D Barcodes (QR ONLY)',
    subtitle: 'All 1D Code: CLOSE | 2D QR: OPEN',
    code: '~M00010000.',
    image: '/v3_disable_1d.png',
    badge: 'QR CODES ONLY',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    instruction: 'Normal 1D barcodes will never be scanned or beep. Scanner only accepts QR codes.',
    tamilInstruction: 'இதை ஸ்கேன் செய்தால் பார்கோடுகள் ஸ்கேன் ஆகாது, Beep சத்தம் வராது. QR Code மட்டுமே ஸ்கேன் ஆகும்!'
  },
  {
    step: 6,
    id: 'save',
    title: 'Save to Memory',
    subtitle: 'Save User Defaults to Flash EEPROM',
    code: '~MA5F0506A.',
    image: '/v3_save.png',
    badge: 'PERMANENT SAVE',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    instruction: 'Permanently saves all settings into internal memory so power off won\'t reset it.',
    tamilInstruction: 'இதை ஸ்கேன் செய்தால் எல்லா செட்டிங்ஸ்களும் நிரந்தரமாக ஸ்கேனரின் மெமரியில் சேவ் ஆகிவிடும்!'
  },
  {
    step: 7,
    id: 'lock',
    title: 'Exit & Lock Config',
    subtitle: 'Scan Code Configuration: OFF',
    code: '~M00910000.',
    image: '/v3_lock.png',
    badge: 'FINISH SETUP',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    instruction: 'Closes configuration mode and returns scanner to normal operating mode.',
    tamilInstruction: 'இதை ஸ்கேன் செய்து செட்டிங் மோடை லாக் செய்து முடித்துக்கொள்ளவும்.'
  }
];

export default function ScannerConfigPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'stepper' | 'grid'>('stepper');

  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Scanner v3.0 Official Specification (e-Gizmo / MH-ET LIVE)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Scanner Hardware Setup &amp; Light Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            ஒவ்வொரு ஸ்டெப்பாக ஸ்கேனரை நோக்கி திரையை காட்டி ஸ்கேன் செய்யவும் (தூரம்: 10cm - 15cm).
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-2xl border border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('stepper')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'stepper'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              Step-by-Step Single QR (பரிந்துரைக்கப்படுகிறது - தவறாக ஸ்கேன் ஆகாது)
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              All Steps Grid View
            </button>
          </div>
          <span className="text-xs font-mono text-slate-400 px-3 hidden sm:inline-block">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* STEP-BY-STEP SINGLE QR VIEW */}
        {viewMode === 'stepper' ? (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center space-y-6">
            
            {/* Step Navigation Dots */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'bg-emerald-500 text-slate-950 scale-110 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400'
                      : idx < currentStepIndex
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {s.step}
                </button>
              ))}
            </div>

            {/* Current Step Card */}
            <div className="text-center space-y-2 max-w-lg">
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${currentStep.badgeColor}`}>
                {currentStep.badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Step {currentStep.step}: {currentStep.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Command: {currentStep.code} &bull; {currentStep.subtitle}
              </p>
            </div>

            {/* Massive Crisp QR Image */}
            <div className="relative group p-4 bg-white rounded-3xl shadow-2xl border-4 border-slate-200">
              <img
                src={currentStep.image}
                alt={currentStep.title}
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto transition-transform group-hover:scale-[1.02]"
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-mono px-3 py-0.5 rounded-full border border-slate-700">
                {currentStep.code}
              </div>
            </div>

            {/* Instruction description */}
            <div className="text-center space-y-1.5 max-w-md bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <p className="text-xs font-medium text-emerald-300">
                {currentStep.instruction}
              </p>
              <p className="text-xs text-slate-300">
                {currentStep.tamilInstruction}
              </p>
            </div>

            {/* Next / Previous Buttons */}
            <div className="flex justify-between w-full max-w-md pt-2">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex(prev => prev - 1)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentStepIndex === 0
                    ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Step
              </button>

              <button
                disabled={currentStepIndex === STEPS.length - 1}
                onClick={() => setCurrentStepIndex(prev => prev + 1)}
                className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentStepIndex === STEPS.length - 1
                    ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-500'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                }`}
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 transition-all"
              >
                <div className="flex items-center justify-between w-full px-1">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                    {s.step}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-300">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-36 h-36 object-contain mx-auto"
                  />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white">
                    {s.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {s.subtitle}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-400 font-bold mt-1">
                    {s.code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alternative: Induction / Sensing Mode Card */}
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-5 text-xs text-slate-300 flex flex-col sm:flex-row items-center gap-5">
          <div className="bg-white p-2.5 rounded-2xl shrink-0">
            <img
              src="/v3_induction_mode.png"
              alt="Induction Mode"
              className="w-28 h-28 object-contain"
            />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
              Alternative Mode: Induction / Auto-Sensing Mode (~M00210002.)
            </div>
            <h4 className="text-sm font-bold text-white">
              Light OFF normally &bull; Turns ON only when paper/phone is in front of camera
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Step 1 (Unlock) ஸ்கேன் செய்த பிறகு, இந்த QR Code-ஐ ஸ்கேன் செய்தால், பொதுவாக லைட் அணைந்தே இருக்கும். பயனர் ஏதேனும் பாஸ் அல்லது க்யூஆர் கோடை ஸ்கேனரின் அருகில் கொண்டு வரும்போது மட்டுமே லைட் எரியும்!
            </p>
          </div>
        </div>

        {/* Return Button */}
        <div className="text-center pt-2">
          <Link
            href="/kiosk/RIT-ATM-01"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Kiosk Terminal</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
