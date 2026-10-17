'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, Zap, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ScannerConfigPage() {
  const [activeTab, setActiveTab] = useState<'off' | 'autolight'>('off');

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Lightbulb className="h-3.5 w-3.5" />
            Official Firmware Sequence
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Turn OFF Scanner White Floodlight &amp; Red Laser
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            MH-ET LIVE / GM65 requires scanning <span className="text-amber-400 font-bold">Step 1 first to unlock configuration mode</span>, then Step 2 to turn off the light, and Step 3 to save.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setActiveTab('off')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'off'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Mode A: Turn White LED Completely OFF (Recommended)
          </button>
          <button
            onClick={() => setActiveTab('autolight')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'autolight'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Mode B: Auto-Light (Only ON during active scan)
          </button>
        </div>

        {/* 4-Step Sequential Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* STEP 1: Unlock */}
          <div className="bg-slate-800/90 border-2 border-amber-500/60 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              1
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                Unlock Config
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Scan this first to unlock
              </p>
            </div>
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-300">
              <img
                src="/step1_unlock.png"
                alt="Step 1: Unlock Setting"
                className="w-36 h-36 object-contain mx-auto"
              />
            </div>
            <span className="text-[10px] font-mono text-amber-400 font-bold">
              Scan 1st &bull; Beeps once
            </span>
          </div>

          {/* STEP 2: Light Selection */}
          <div className="bg-slate-800/90 border-2 border-emerald-500/60 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
              2
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                {activeTab === 'off' ? 'Turn OFF White Light' : 'Auto-Light Mode'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeTab === 'off' ? 'Light will turn OFF' : 'On only when reading'}
              </p>
            </div>
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-300">
              <img
                src={activeTab === 'off' ? '/step2_white_led_off.png' : '/step2_white_led_standard.png'}
                alt="Step 2: Lighting setting"
                className="w-36 h-36 object-contain mx-auto"
              />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Scan 2nd &bull; LED switches off!
            </span>
          </div>

          {/* STEP 3: Turn OFF Red Laser */}
          <div className="bg-slate-800/90 border border-slate-700 hover:border-purple-500 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
            <div className="w-7 h-7 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center">
              3
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                Turn OFF Red Laser
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Disables red aiming beam
              </p>
            </div>
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-300">
              <img
                src="/step3_red_laser_off.png"
                alt="Step 3: Red Laser OFF"
                className="w-36 h-36 object-contain mx-auto"
              />
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold">
              Scan 3rd (Optional)
            </span>
          </div>

          {/* STEP 4: Save Default */}
          <div className="bg-slate-800/90 border-2 border-blue-500/60 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center">
              4
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-blue-300 uppercase tracking-wider">
                Save to Memory
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Saves setting permanently
              </p>
            </div>
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-300">
              <img
                src="/step4_save.png"
                alt="Step 4: Save Setting"
                className="w-36 h-36 object-contain mx-auto"
              />
            </div>
            <span className="text-[10px] font-mono text-blue-400 font-bold">
              Scan 4th &bull; Locks memory
            </span>
          </div>

        </div>

        {/* Warning & Instructions */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>முக்கியமான குறிப்பு (How to scan correctly):</span>
          </div>
          <p className="leading-relaxed">
            1. முதலாவதாக <span className="font-bold text-amber-300">Box 1 (Unlock Config)</span>-ஐ ஸ்கேன் செய்யுங்கள் (Beep சத்தம் வரும்).<br />
            2. அடுத்து உடனே <span className="font-bold text-emerald-300">Box 2 (Turn OFF White Light)</span>-ஐ ஸ்கேன் செய்யுங்கள் — <span className="text-white font-bold underline">வெள்ளை லைட் உடனே அணைந்துவிடும்!</span><br />
            3. அடுத்து <span className="font-bold text-purple-300">Box 3 (Turn OFF Red Laser)</span> ஸ்கேன் செய்தால் சிவப்பு லேசரும் அணைந்துவிடும்.<br />
            4. இறுதியாக <span className="font-bold text-blue-300">Box 4 (Save to Memory)</span> ஸ்கேன் செய்தால் இந்த செட்டிங் ஸ்கேனரின் மெமரியில் நிரந்தரமாக சேவ் ஆகிவிடும்!
          </p>
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
