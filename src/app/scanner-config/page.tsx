'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ScannerConfigPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Lightbulb className="h-3.5 w-3.5" />
            Hardware LED Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            MH-ET LIVE / GM65 Scanner LED Fix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Scan these official configuration QR codes directly from your screen with your scanner to immediately turn OFF the white floodlight LED and red laser!
          </p>
        </div>

        {/* Quick Instant Fix (Hardware Button) */}
        <div className="bg-blue-950/60 border border-blue-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <h3 className="text-sm font-bold text-blue-200">
              ⚡ Instant Fix: Press the Button on the Board!
            </h3>
            <p className="text-xs text-blue-300/80 leading-relaxed">
              Your scanner board has a small black tactile push button right next to the white ribbon cable. 
              In continuous mode, <span className="font-bold text-white">single pressing that black button immediately stops scanning and turns the LED OFF</span>!
            </p>
          </div>
        </div>

        {/* The Official Config Barcodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          
          {/* Card 1: Turn OFF White LED Completely */}
          <div className="bg-slate-800/80 border-2 border-emerald-500/50 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-lg group transition-all">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
              <CheckCircle2 className="h-4 w-4" />
              <span>Recommended Fix</span>
            </div>
            <h3 className="text-base font-extrabold text-white">
              1. Turn OFF White LED (No Light)
            </h3>
            <p className="text-xs text-slate-400">
              Permanently turns off the bright white floodlight. Phone screens are backlit so scanning still works perfectly in the dark!
            </p>
            <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-300">
              <img
                src="/qr_light_off.png"
                alt="Turn OFF White LED"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400">
              Point scanner here to turn OFF White LED
            </span>
          </div>

          {/* Card 2: Standard Auto-Light (Only on during scan) */}
          <div className="bg-slate-800/80 border border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-lg group transition-all">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase">
              <Zap className="h-4 w-4" />
              <span>Alternative Mode</span>
            </div>
            <h3 className="text-base font-extrabold text-white">
              2. Standard Lighting (Auto-Light)
            </h3>
            <p className="text-xs text-slate-400">
              LED turns ON only while actively decoding a barcode, and stays completely OFF all other times.
            </p>
            <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-300">
              <img
                src="/qr_light_standard.png"
                alt="Standard Lighting"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-400">
              Point scanner here for Standard Auto-Light
            </span>
          </div>

          {/* Card 3: Turn OFF Red Aiming Beam */}
          <div className="bg-slate-800/80 border border-slate-700 hover:border-purple-500 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-lg group transition-all">
            <h3 className="text-base font-extrabold text-white">
              3. Turn OFF Red Targeting Beam
            </h3>
            <p className="text-xs text-slate-400">
              Disables the red laser pointing beam so no red light is emitted.
            </p>
            <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-300">
              <img
                src="/qr_target_off.png"
                alt="No Targeting Beam"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-400">
              Point scanner here to turn OFF Red Beam
            </span>
          </div>

          {/* Card 4: Sensing Mode (Auto-Induction) */}
          <div className="bg-slate-800/80 border border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-lg group transition-all">
            <h3 className="text-base font-extrabold text-white">
              4. Sensing / Auto-Induction Mode
            </h3>
            <p className="text-xs text-slate-400">
              Module sleeps quietly until a phone moves in front of the lens. Only wakes up to scan then sleeps!
            </p>
            <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-300">
              <img
                src="/qr_mode_sensing.png"
                alt="Sensing Mode"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-400">
              Point scanner here for Auto-Sensing Mode
            </span>
          </div>

        </div>

        {/* Steps Guide */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>How to apply:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
            <li>Hold your MH-ET LIVE scanner about 10–15 cm away from the QR code on your screen.</li>
            <li>Aim at <span className="font-bold text-emerald-300">Card 1 ("Turn OFF White LED")</span>.</li>
            <li>The scanner will emit a beep confirmation, and <span className="font-bold text-white">the bright white light will immediately shut off forever!</span></li>
          </ol>
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
