'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Lightbulb, QrCode, ShieldAlert, Sparkles, VolumeX } from 'lucide-react';

export default function ScannerSetupPage() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (step: number) => {
    if (completedSteps.includes(step)) {
      setCompletedSteps(completedSteps.filter((s) => s !== step));
    } else {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-8 flex flex-col items-center font-sans">
      {/* Top Header */}
      <div className="max-w-3xl w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <Link
          href="/kiosk/RIT-ATM-01"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Kiosk Display</span>
        </Link>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          MH-ET LIVE / GM65 Hardware Setup
        </span>
      </div>

      {/* Main Title */}
      <div className="max-w-3xl w-full text-center space-y-3 pt-8 pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Instant Hardware Light &amp; Barcode Fix</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          MH-ET LIVE Scanner Calibration
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Hold your scanner pointing at these 4 official barcodes on your screen. As soon as you scan each code, your scanner will beep and save the settings into its hardware memory!
        </p>
      </div>

      {/* Cards List */}
      <div className="max-w-2xl w-full space-y-6">

        {/* STEP 1: Turn OFF White Spotlight */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">1</span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Turn OFF White Spotlight (No Light)
                </h2>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Scan this code to permanently extinguish the blinding white LED spotlight on your desk.
              </p>
            </div>
            <button
              onClick={() => toggleStep(1)}
              className={`p-1.5 rounded-lg border transition-all ${
                completedSteps.includes(1)
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <img
              src="/scanner_configs/step1_no_light.png"
              alt="Scan to Turn OFF White Light"
              className="max-h-28 object-contain"
            />
            <span className="text-[11px] font-mono font-bold text-slate-800 mt-2">
              [ SCAN THIS CODE: LIGHTING -> NO LIGHT ]
            </span>
          </div>
        </div>

        {/* STEP 2: Turn OFF Red Aiming Beam */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">2</span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  Turn OFF Red Aiming Beam (No Targeting)
                </h2>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Turns off the red laser aiming light so the scanner is completely dark when idle.
              </p>
            </div>
            <button
              onClick={() => toggleStep(2)}
              className={`p-1.5 rounded-lg border transition-all ${
                completedSteps.includes(2)
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <img
              src="/scanner_configs/step2_no_targeting.png"
              alt="Scan to Turn OFF Red Aiming Beam"
              className="max-h-28 object-contain"
            />
            <span className="text-[11px] font-mono font-bold text-slate-800 mt-2">
              [ SCAN THIS CODE: TARGETING -> NO TARGETING ]
            </span>
          </div>
        </div>

        {/* STEP 3: Disable 1D Barcodes (Mutes Raspberry Pi Box Beep) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">3</span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <VolumeX className="h-4 w-4 text-amber-400" />
                  Disable All 1D Barcodes (Stop Beeping on Box)
                </h2>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Prevents the scanner from reading normal 1D linear barcodes (like on your Raspberry Pi box).
              </p>
            </div>
            <button
              onClick={() => toggleStep(3)}
              className={`p-1.5 rounded-lg border transition-all ${
                completedSteps.includes(3)
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <img
              src="/scanner_configs/step3_disable_all_barcodes.png"
              alt="Scan to Disable All 1D Barcodes"
              className="max-h-28 object-contain"
            />
            <span className="text-[11px] font-mono font-bold text-slate-800 mt-2">
              [ SCAN THIS CODE: DISABLE ALL BARCODES ]
            </span>
          </div>
        </div>

        {/* STEP 4: Enable QR Code */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">4</span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-emerald-400" />
                  Enable 2D QR Code Only
                </h2>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Ensures 2D QR Codes (your mobile order receipts) are enabled for scanning.
              </p>
            </div>
            <button
              onClick={() => toggleStep(4)}
              className={`p-1.5 rounded-lg border transition-all ${
                completedSteps.includes(4)
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <img
              src="/scanner_configs/step4_enable_qr_code.png"
              alt="Scan to Enable QR Code"
              className="max-h-28 object-contain"
            />
            <span className="text-[11px] font-mono font-bold text-slate-800 mt-2">
              [ SCAN THIS CODE: ENABLE SCANNING QR ]
            </span>
          </div>
        </div>

        {/* STEP 5: Save Settings Permanently to Flash Memory */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">5</span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Save Settings to Hardware Flash
                </h2>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Writes the new configuration into the scanner&apos;s internal EEPROM memory so it stays permanently configured even after reboot.
              </p>
            </div>
            <button
              onClick={() => toggleStep(5)}
              className={`p-1.5 rounded-lg border transition-all ${
                completedSteps.includes(5)
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner">
            <img
              src="/scanner_configs/step5_save_to_flash.png"
              alt="Scan to Save to Flash Memory"
              className="max-h-28 object-contain"
            />
            <span className="text-[11px] font-mono font-bold text-slate-800 mt-2">
              [ SCAN THIS CODE: SAVE TO FLASH ]
            </span>
          </div>
        </div>

      </div>

      {/* Alternative Option Card: Standard Light (LED only on while reading) */}
      <div className="max-w-2xl w-full mt-10 p-6 rounded-3xl bg-blue-950/40 border border-blue-800/40 text-center space-y-3">
        <h3 className="text-base font-bold text-blue-200">
          Want the light to turn ON only when reading, and stay OFF otherwise?
        </h3>
        <p className="text-xs text-blue-300/80 max-w-lg mx-auto">
          If you prefer the white LED to illuminate only during the split-second of scanning, scan this &quot;Standard Light&quot; code instead of Step 1:
        </p>
        <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mt-2">
          <img
            src="/scanner_configs/step1b_standard_light.png"
            alt="Scan for Standard Lighting"
            className="max-h-24 object-contain mx-auto"
          />
          <span className="text-[10px] font-mono font-bold text-slate-800 block mt-1">
            [ LIGHTING: STANDARD (LED ON ONLY WHEN SCANNING) ]
          </span>
        </div>
      </div>
    </div>
  );
}
