'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UploadCloud, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Sparkles, 
  QrCode, 
  Layers, 
  ArrowRight, 
  HelpCircle, 
  Lock, 
  ExternalLink, 
  ChevronDown, 
  Building2, 
  Cpu, 
  Radio, 
  Sliders, 
  Check, 
  Plus, 
  Minus, 
  Menu, 
  X, 
  Flame, 
  Activity, 
  Server,
  UserCheck,
  Download,
  XCircle,
  ArrowLeftRight
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function WhiteAndBlueLandingPage() {
  // Mobile Navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Top Scroll Progress State
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Scroll progress handler
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const scroll = (totalScroll / windowHeight) * 100;
        setScrollProgress(scroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // IntersectionObserver for smooth scroll-reveal effect on sections
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#2563eb] selection:text-white relative bg-futuristic-grid overflow-x-hidden">
      
      {/* ── TOP SCROLL PROGRESS BAR ── */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#2563eb] via-cyan-400 to-emerald-400 z-[100] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ── FLOATING PILL NAVIGATION (CENTERED LOGO MATCHING REFERENCE) ── */}
      <div className="sticky top-2 sm:top-5 z-50 max-w-5xl mx-auto px-2 xs:px-4 sm:px-6">
        <header className="rounded-full bg-white/95 backdrop-blur-md px-3 xs:px-4 sm:px-8 py-2 sm:py-3 flex items-center justify-between border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
          
          {/* Left Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-bold text-slate-800">
            <a href="#how-it-works" className="hover:text-[#2563eb] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#2563eb] transition-colors">
              Features
            </a>
          </nav>

          {/* Centered Logo */}
          <div className="flex items-center justify-center shrink-0">
            <Logo size="md" />
          </div>

          {/* Right Nav Links & CTA Action */}
          <div className="flex items-center gap-2 sm:gap-6 lg:gap-8 shrink-0">
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-bold text-slate-800">
              <a href="#comparison" className="hover:text-[#2563eb] transition-colors">
                Comparison
              </a>
              <a href="#faq" className="hover:text-[#2563eb] transition-colors">
                FAQ &amp; Support
              </a>
            </nav>

            <Link
              href="/upload"
              className="px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 sm:py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-md shadow-blue-500/25 active:scale-95 transition-all shrink-0"
            >
              <UploadCloud className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Print Document</span>
              <span className="xs:hidden">Print</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline-block" />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 xs:p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/98 backdrop-blur-lg rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xl border border-slate-200 animate-fade-in">
            <nav className="flex flex-col space-y-1 text-sm font-bold text-slate-800">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-[#2563eb] transition-colors">How It Works</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-[#2563eb] transition-colors">Why SmartPrint (Features)</a>
              <a href="#comparison" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-[#2563eb] transition-colors">Smarter vs Traditional</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-[#2563eb] transition-colors">FAQ & Support</a>
            </nav>
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link href="/upload" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-full bg-[#2563eb] text-white text-center font-extrabold text-xs shadow-md">Upload Document to Print</Link>
            </div>
          </div>
        )}
      </div>

      {/* ── HERO SECTION (MATCHING REFERENCE IN HIGH CONTRAST & ROYAL BLUE) ── */}
      <section className="relative pt-6 sm:pt-14 pb-10 sm:pb-24 overflow-hidden reveal-on-scroll is-revealed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          
          {/* Main Hero Header */}
          <div className="text-center space-y-4 sm:space-y-7 max-w-5xl mx-auto">
            
            {/* High Impact Strong Black & Royal Blue Balanced Title */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[64px] font-black text-[#000000] tracking-[-0.035em] leading-[1.18] max-w-4xl mx-auto [text-wrap:balance]">
              Meet <span className="text-[#2563eb]">SmartPrint</span>, RIT&apos;s Anytime, <br className="hidden sm:inline" />
              Anywhere Instant Printing Kiosk
            </h1>

            {/* Hero Actions (Clean Pill Buttons with Balanced Alignment) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 px-2 w-full max-w-lg mx-auto">
              <Link
                href="/upload"
                className="w-full sm:w-auto px-5 sm:px-8 py-3 sm:py-4 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-xs xs:text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-600/35 active:scale-98 transition-all whitespace-nowrap"
              >
                <UploadCloud className="w-4 sm:w-5 h-4 sm:h-5 stroke-[2.5]" />
                <span>Print Document</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-5 sm:px-8 py-3 sm:py-4 rounded-full border-2 border-slate-300 hover:border-[#2563eb] text-slate-800 hover:text-[#2563eb] bg-white hover:bg-blue-50/50 font-extrabold text-xs xs:text-sm sm:text-base flex items-center justify-center gap-2 transition-all whitespace-nowrap"
              >
                <span>How It Works</span>
              </a>
            </div>

            {/* Micro Feature Metric Pills */}
            <div className="pt-2 sm:pt-4 flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-4 flex-wrap text-[9px] xs:text-[10px] sm:text-xs font-bold text-slate-700 font-mono">
              <span className="glass-pill px-2.5 xs:px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200 shadow-2xs">
                <Zap className="w-3 h-3 text-[#2563eb]" />
                <span>30-SEC LASER FUSION</span>
              </span>
              <span className="glass-pill px-2.5 xs:px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-[#0284c7]" />
                <span>DoD ZERO-MEMORY SHRED</span>
              </span>
              <span className="glass-pill px-2.5 xs:px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200 shadow-2xs">
                <Clock className="w-3 h-3 text-[#2563eb]" />
                <span>24/7 HOSTEL RADAR</span>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── PRONOUNCED X-CRISS-CROSS ANGLED RUNNING MARQUEE RIBBONS ── */}
      <div className="relative py-10 sm:py-20 overflow-hidden w-full select-none my-4 sm:my-10 flex items-center justify-center min-h-[140px] sm:min-h-[220px] max-w-[100vw]">
        
        {/* White Ribbon (Angled Upwards +4.5deg) */}
        <div className="absolute w-[200%] sm:w-[150%] -left-[50%] sm:-left-[25%] py-3.5 sm:py-5 bg-white/95 backdrop-blur-md border-y border-slate-200/90 shadow-md transform rotate-[4.5deg] overflow-hidden flex items-center z-10">
          <div className="animate-marquee gap-8 sm:gap-14 text-sm sm:text-base font-bold text-slate-800 tracking-wide font-sans">
            <div className="flex items-center gap-6 sm:gap-8 shrink-0">
              <span>No Queues</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Contactless Prints</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Instant Print</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>No Queues</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Contactless Prints</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Instant Print</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>No Queues</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Contactless Prints</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Instant Print</span> <span className="text-[#2563eb] text-base">✦</span>
            </div>
            <div className="flex items-center gap-6 sm:gap-8 shrink-0">
              <span>No Queues</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Contactless Prints</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Instant Print</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>No Queues</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Contactless Prints</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Instant Print</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>No Queues</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Contactless Prints</span> <span className="text-[#2563eb] text-base">✦</span>
              <span>Instant Print</span> <span className="text-[#2563eb] text-base">✦</span>
            </div>
          </div>
        </div>

        {/* Foreground Royal Blue Ribbon (Angled Downwards -4.5deg Crossing Over) */}
        <div className="absolute w-[200%] sm:w-[150%] -left-[50%] sm:-left-[25%] py-3.5 sm:py-5.5 bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#2563eb] text-white shadow-2xl transform -rotate-[4.5deg] overflow-hidden flex items-center z-20">
          <div className="animate-marquee-reverse gap-8 sm:gap-14 text-sm sm:text-base font-black text-white tracking-wide font-sans">
            <div className="flex items-center gap-6 sm:gap-8 shrink-0">
              <span>Smart Printing</span> <span className="text-white/80 text-base">✦</span>
              <span>24/7 Service</span> <span className="text-white/80 text-base">✦</span>
              <span>Encrypted Files</span> <span className="text-white/80 text-base">✦</span>
              <span>Smart Printing</span> <span className="text-white/80 text-base">✦</span>
              <span>24/7 Service</span> <span className="text-white/80 text-base">✦</span>
              <span>Encrypted Files</span> <span className="text-white/80 text-base">✦</span>
              <span>Smart Printing</span> <span className="text-white/80 text-base">✦</span>
              <span>24/7 Service</span> <span className="text-white/80 text-base">✦</span>
              <span>Encrypted Files</span> <span className="text-white/80 text-base">✦</span>
            </div>
            <div className="flex items-center gap-6 sm:gap-8 shrink-0">
              <span>Smart Printing</span> <span className="text-white/80 text-base">✦</span>
              <span>24/7 Service</span> <span className="text-white/80 text-base">✦</span>
              <span>Encrypted Files</span> <span className="text-white/80 text-base">✦</span>
              <span>Smart Printing</span> <span className="text-white/80 text-base">✦</span>
              <span>24/7 Service</span> <span className="text-white/80 text-base">✦</span>
              <span>Encrypted Files</span> <span className="text-white/80 text-base">✦</span>
              <span>Smart Printing</span> <span className="text-white/80 text-base">✦</span>
              <span>24/7 Service</span> <span className="text-white/80 text-base">✦</span>
              <span>Encrypted Files</span> <span className="text-white/80 text-base">✦</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 4-STEP HOW IT WORKS WORKFLOW (EXACT MATCH TO COMPETITOR DESIGN IN ROYAL BLUE) ── */}
      <section id="how-it-works" className="py-14 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14 reveal-on-scroll">
        
        {/* Section Header */}
        <div className="text-center space-y-2 sm:space-y-3 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base font-semibold text-slate-500 tracking-wide">
            Fast. Secure. Completely Contactless.
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-[#000000] tracking-tight">
            How It Works
          </h2>
        </div>

        {/* 4 Cards Grid with Ultra-Realistic Titanium iPhone Mockups Matching Exact Competitor Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* ── CARD 1: STEP 1 (SCAN QR) ── */}
          <div className="rounded-[2.5rem] bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e40af] p-5 sm:p-6 text-white flex flex-col justify-between shadow-2xl shadow-blue-700/30 overflow-hidden group hover:-translate-y-2 transition-all duration-300 relative border border-blue-400/20">
            
            {/* Top Text Content */}
            <div className="text-center space-y-2.5 pb-6">
              <span className="inline-block px-5 py-1.5 rounded-full bg-white text-[#2563eb] font-extrabold text-xs tracking-wider shadow-md uppercase">
                Step 1
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Scan the Kiosk QR
              </h3>
              <p className="text-xs sm:text-[13px] text-blue-100 font-normal leading-relaxed">
                Each SmartPrint kiosk has their very own unique QR – scan it using your mobile camera.
              </p>
            </div>

            {/* Ultra-Realistic Titanium iPhone 16 Pro Mockup */}
            <div className="mt-auto pt-2 flex justify-center">
              <div className="w-full max-w-[245px] relative">
                
                {/* Physical Titanium Hardware Side Buttons */}
                <div className="absolute -left-[3px] top-16 w-[3px] h-3.5 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -left-[3px] top-24 w-[3px] h-7 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -left-[3px] top-34 w-[3px] h-7 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -right-[3px] top-24 w-[3px] h-11 bg-[#475569] rounded-r-xs shadow-xs" />

                {/* iPhone Titanium Chassis Outer Frame */}
                <div className="bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] rounded-t-[44px] p-[5px] pb-0 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4),0_0_0_1px_rgba(255,255,255,0.15)] relative">
                  
                  {/* Speaker Ear-piece Micro Slit */}
                  <div className="w-10 h-[3px] bg-[#090d16] rounded-full mx-auto mb-1.5 opacity-80" />

                  {/* Super Retina XDR OLED Screen */}
                  <div className="bg-[#f8fafc] rounded-t-[38px] text-slate-900 h-[360px] flex flex-col justify-between overflow-hidden relative shadow-inner select-none border border-slate-200/50">
                    
                    {/* iOS Status Bar + Dynamic Island */}
                    <div className="pt-2 px-3.5 flex items-center justify-between relative z-20 bg-blue-50/40 backdrop-blur-xs">
                      <span className="text-[10px] font-bold tracking-tight text-slate-900 font-sans">9:41</span>
                      
                      <div className="w-18 h-[18px] bg-black rounded-full flex items-center justify-between px-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[#0a0a0f] ring-1 ring-white/20 flex items-center justify-center">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#1e40af]" />
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                      </div>

                      <div className="flex items-center gap-1 text-slate-900">
                        <div className="flex items-end gap-[1px] h-2">
                          <span className="w-[1.5px] h-1 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-1.5 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-2 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-2.5 bg-slate-900 rounded-3xs" />
                        </div>
                        <span className="text-[7px] font-bold font-mono">5G</span>
                        <div className="w-4 h-2 border border-slate-900 rounded-[2px] p-[1px] flex items-center">
                          <span className="w-[85%] h-full bg-[#10b981] rounded-[1px] block" />
                        </div>
                      </div>
                    </div>

                    {/* App Header: Logo + Help Button */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200/80 bg-blue-50/40">
                      <div className="flex items-center gap-1.5">
                        <img src="/rit-logo.png" alt="RIT" className="h-4 w-auto object-contain max-w-[75px]" />
                        <span className="text-[11px] font-black text-slate-900 tracking-tight">
                          Smart<span className="text-[#2563eb]">Print</span>
                        </span>
                      </div>
                      <div className="px-2 py-0.5 rounded-lg border border-slate-300/80 bg-white text-slate-700 text-[8px] font-bold flex items-center gap-1 shadow-2xs">
                        <HelpCircle className="w-2.5 h-2.5 text-slate-500" />
                        <span>Help</span>
                      </div>
                    </div>

                    {/* Main UI: Green/Blue Scanner Viewfinder with Crisp QR */}
                    <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                      
                      {/* Viewfinder Target Container */}
                      <div className="relative rounded-2xl p-3 flex flex-col items-center justify-center my-auto">
                        
                        {/* 4 Viewfinder Corner Brackets */}
                        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#2563eb] rounded-tl-sm" />
                        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#2563eb] rounded-tr-sm" />
                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#2563eb] rounded-bl-sm" />
                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#2563eb] rounded-br-sm" />

                        {/* Generated High Density QR Code */}
                        <div className="p-2 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] shadow-md">
                          <div className="p-1.5 bg-white rounded-lg">
                            <svg viewBox="0 0 100 100" className="w-24 h-24" fill="currentColor">
                              {/* Finder Top-Left */}
                              <rect x="5" y="5" width="28" height="28" rx="3" fill="#0f172a" />
                              <rect x="9" y="9" width="20" height="20" rx="1.5" fill="#ffffff" />
                              <rect x="13" y="13" width="12" height="12" rx="1" fill="#0f172a" />
                              {/* Finder Top-Right */}
                              <rect x="67" y="5" width="28" height="28" rx="3" fill="#0f172a" />
                              <rect x="71" y="9" width="20" height="20" rx="1.5" fill="#ffffff" />
                              <rect x="75" y="13" width="12" height="12" rx="1" fill="#0f172a" />
                              {/* Finder Bottom-Left */}
                              <rect x="5" y="67" width="28" height="28" rx="3" fill="#0f172a" />
                              <rect x="9" y="71" width="20" height="20" rx="1.5" fill="#ffffff" />
                              <rect x="13" y="75" width="12" height="12" rx="1" fill="#0f172a" />
                              {/* Alignment Bottom-Right */}
                              <rect x="71" y="71" width="20" height="20" rx="2" fill="#0f172a" />
                              <rect x="75" y="75" width="12" height="12" rx="1" fill="#ffffff" />
                              <rect x="79" y="79" width="4" height="4" fill="#0f172a" />
                              {/* Timing Tracks */}
                              <rect x="37" y="17" width="4" height="4" fill="#0f172a" />
                              <rect x="45" y="17" width="4" height="4" fill="#0f172a" />
                              <rect x="53" y="17" width="4" height="4" fill="#0f172a" />
                              <rect x="61" y="17" width="4" height="4" fill="#0f172a" />
                              <rect x="17" y="37" width="4" height="4" fill="#0f172a" />
                              <rect x="17" y="45" width="4" height="4" fill="#0f172a" />
                              <rect x="17" y="53" width="4" height="4" fill="#0f172a" />
                              <rect x="17" y="61" width="4" height="4" fill="#0f172a" />
                              {/* Data Matrix Modules */}
                              <rect x="37" y="5" width="4" height="4" fill="#0f172a" />
                              <rect x="45" y="5" width="8" height="4" fill="#0f172a" />
                              <rect x="57" y="5" width="4" height="4" fill="#0f172a" />
                              <rect x="37" y="9" width="8" height="4" fill="#0f172a" />
                              <rect x="53" y="9" width="4" height="4" fill="#0f172a" />
                              <rect x="61" y="9" width="4" height="4" fill="#0f172a" />
                              <rect x="41" y="13" width="4" height="4" fill="#0f172a" />
                              <rect x="49" y="13" width="8" height="4" fill="#0f172a" />
                              <rect x="5" y="37" width="8" height="4" fill="#0f172a" />
                              <rect x="25" y="37" width="4" height="4" fill="#0f172a" />
                              <rect x="37" y="37" width="4" height="4" fill="#0f172a" />
                              <rect x="57" y="37" width="8" height="4" fill="#0f172a" />
                              <rect x="69" y="37" width="4" height="4" fill="#0f172a" />
                              <rect x="81" y="37" width="8" height="4" fill="#0f172a" />
                              <rect x="9" y="41" width="4" height="4" fill="#0f172a" />
                              <rect x="21" y="41" width="8" height="4" fill="#0f172a" />
                              <rect x="69" y="41" width="8" height="4" fill="#0f172a" />
                              <rect x="89" y="41" width="4" height="4" fill="#0f172a" />
                              <rect x="5" y="49" width="4" height="4" fill="#0f172a" />
                              <rect x="25" y="49" width="8" height="4" fill="#0f172a" />
                              <rect x="69" y="49" width="4" height="4" fill="#0f172a" />
                              <rect x="81" y="49" width="4" height="4" fill="#0f172a" />
                              <rect x="89" y="49" width="4" height="4" fill="#0f172a" />
                              <rect x="9" y="57" width="8" height="4" fill="#0f172a" />
                              <rect x="21" y="57" width="4" height="4" fill="#0f172a" />
                              <rect x="37" y="57" width="8" height="4" fill="#0f172a" />
                              <rect x="57" y="57" width="4" height="4" fill="#0f172a" />
                              <rect x="69" y="57" width="8" height="4" fill="#0f172a" />
                              <rect x="85" y="57" width="4" height="4" fill="#0f172a" />
                              <rect x="37" y="69" width="8" height="4" fill="#0f172a" />
                              <rect x="53" y="69" width="4" height="4" fill="#0f172a" />
                              <rect x="61" y="69" width="4" height="4" fill="#0f172a" />
                              <rect x="41" y="73" width="4" height="4" fill="#0f172a" />
                              <rect x="49" y="73" width="8" height="4" fill="#0f172a" />
                              <rect x="37" y="81" width="4" height="4" fill="#0f172a" />
                              <rect x="45" y="81" width="8" height="4" fill="#0f172a" />
                              <rect x="57" y="81" width="4" height="4" fill="#0f172a" />
                              <rect x="37" y="89" width="8" height="4" fill="#0f172a" />
                              <rect x="49" y="89" width="4" height="4" fill="#0f172a" />
                              <rect x="57" y="89" width="8" height="4" fill="#0f172a" />
                            </svg>
                          </div>
                        </div>

                      </div>

                      {/* Bottom Button: Scan QR */}
                      <button className="w-full py-2 rounded-xl bg-[#2563eb] text-white font-black text-[9px] shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Scan QR</span>
                      </button>

                    </div>

                    {/* iOS Home Indicator Bar */}
                    <div className="py-1 bg-white flex justify-center">
                      <div className="w-20 h-1 bg-slate-300 rounded-full" />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 2: STEP 2 (UPLOAD FILES) ── */}
          <div className="rounded-[2.5rem] bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e40af] p-5 sm:p-6 text-white flex flex-col justify-between shadow-2xl shadow-blue-700/30 overflow-hidden group hover:-translate-y-2 transition-all duration-300 relative border border-blue-400/20">
            
            {/* Top Text Content */}
            <div className="text-center space-y-2.5 pb-6">
              <span className="inline-block px-5 py-1.5 rounded-full bg-white text-[#2563eb] font-extrabold text-xs tracking-wider shadow-md uppercase">
                Step 2
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Upload Your Document
              </h3>
              <p className="text-xs sm:text-[13px] text-blue-100 font-normal leading-relaxed">
                Choose your required document from phone, laptop, or Google Drive. No sign-up required.
              </p>
            </div>

            {/* Ultra-Realistic Titanium iPhone 16 Pro Mockup */}
            <div className="mt-auto pt-2 flex justify-center">
              <div className="w-full max-w-[245px] relative">
                
                {/* Physical Titanium Hardware Side Buttons */}
                <div className="absolute -left-[3px] top-16 w-[3px] h-3.5 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -left-[3px] top-24 w-[3px] h-7 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -left-[3px] top-34 w-[3px] h-7 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -right-[3px] top-24 w-[3px] h-11 bg-[#475569] rounded-r-xs shadow-xs" />

                {/* iPhone Titanium Chassis Outer Frame */}
                <div className="bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] rounded-t-[44px] p-[5px] pb-0 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4),0_0_0_1px_rgba(255,255,255,0.15)] relative">
                  
                  {/* Speaker Ear-piece Micro Slit */}
                  <div className="w-10 h-[3px] bg-[#090d16] rounded-full mx-auto mb-1.5 opacity-80" />

                  {/* Super Retina XDR OLED Screen */}
                  <div className="bg-[#f8fafc] rounded-t-[38px] text-slate-900 h-[360px] flex flex-col justify-between overflow-hidden relative shadow-inner select-none border border-slate-200/50">
                    
                    {/* iOS Status Bar + Dynamic Island */}
                    <div className="pt-2 px-3.5 flex items-center justify-between relative z-20 bg-blue-50/40 backdrop-blur-xs">
                      <span className="text-[10px] font-bold tracking-tight text-slate-900 font-sans">9:41</span>
                      
                      <div className="w-18 h-[18px] bg-black rounded-full flex items-center justify-between px-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[#0a0a0f] ring-1 ring-white/20 flex items-center justify-center">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#1e40af]" />
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                      </div>

                      <div className="flex items-center gap-1 text-slate-900">
                        <div className="flex items-end gap-[1px] h-2">
                          <span className="w-[1.5px] h-1 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-1.5 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-2 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-2.5 bg-slate-900 rounded-3xs" />
                        </div>
                        <span className="text-[7px] font-bold font-mono">5G</span>
                        <div className="w-4 h-2 border border-slate-900 rounded-[2px] p-[1px] flex items-center">
                          <span className="w-[85%] h-full bg-[#10b981] rounded-[1px] block" />
                        </div>
                      </div>
                    </div>

                    {/* App Header: Kiosk ID + Help Button */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200/80 bg-blue-50/40">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-black text-[7.5px] shadow-2xs">
                          RIT
                        </div>
                        <div className="leading-tight">
                          <div className="text-[9px] font-black text-slate-900 flex items-center gap-0.5">
                            Kiosk #021548 <span className="text-[8px] text-slate-500">▾</span>
                          </div>
                          <div className="text-[7px] text-slate-500 font-semibold">Library Kiosk</div>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded-lg border border-slate-300/80 bg-white text-slate-700 text-[8px] font-bold flex items-center gap-1 shadow-2xs">
                        <HelpCircle className="w-2.5 h-2.5 text-slate-500" />
                        <span>Help</span>
                      </div>
                    </div>

                    {/* Main UI: Upload Container Card */}
                    <div className="p-3 flex-1 flex flex-col justify-start space-y-2 bg-white">
                      
                      {/* Upload Card */}
                      <div className="p-3 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                        
                        {/* Add Files Drop Box */}
                        <div className="py-5 px-3 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 text-center space-y-1.5">
                          <div className="w-7 h-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center mx-auto text-xs font-bold shadow-xs">
                            +
                          </div>
                          <div className="text-[9px] font-extrabold text-slate-800">
                            Add files
                          </div>
                        </div>

                        {/* Security Banner */}
                        <div className="py-1 px-2 rounded-lg bg-blue-50/80 border border-blue-200/60 text-[7.5px] font-semibold text-[#2563eb] flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-[#2563eb]" />
                          <span>We delete your files once printed</span>
                        </div>

                      </div>

                      {/* Small File Type Specs */}
                      <div className="text-[7px] text-slate-400 font-medium text-center">
                        Accepted formats: PDF, DOCX, JPG, PNG. Max 100MB per file.
                      </div>

                      {/* Partially Visible Bottom Card */}
                      <div className="p-2 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between opacity-80">
                        <span className="text-[8px] font-bold text-slate-700">Number of Copies</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100/70 text-[#2563eb] text-[8px] font-bold">
                          <span>−</span>
                          <span>0</span>
                          <span>+</span>
                        </div>
                      </div>

                    </div>

                    {/* iOS Home Indicator Bar */}
                    <div className="py-1 bg-white flex justify-center">
                      <div className="w-20 h-1 bg-slate-300 rounded-full" />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 3: STEP 3 (PRINT PREFERENCES) ── */}
          <div className="rounded-[2.5rem] bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e40af] p-5 sm:p-6 text-white flex flex-col justify-between shadow-2xl shadow-blue-700/30 overflow-hidden group hover:-translate-y-2 transition-all duration-300 relative border border-blue-400/20">
            
            {/* Top Text Content */}
            <div className="text-center space-y-2.5 pb-6">
              <span className="inline-block px-5 py-1.5 rounded-full bg-white text-[#2563eb] font-extrabold text-xs tracking-wider shadow-md uppercase">
                Step 3
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Set Print Preference
              </h3>
              <p className="text-xs sm:text-[13px] text-blue-100 font-normal leading-relaxed">
                Set number of copies, B&W or color, duplex/single-side &amp; orientation for your preferred print settings.
              </p>
            </div>

            {/* Ultra-Realistic Titanium iPhone 16 Pro Mockup */}
            <div className="mt-auto pt-2 flex justify-center">
              <div className="w-full max-w-[245px] relative">
                
                {/* Physical Titanium Hardware Side Buttons */}
                <div className="absolute -left-[3px] top-16 w-[3px] h-3.5 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -left-[3px] top-24 w-[3px] h-7 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -left-[3px] top-34 w-[3px] h-7 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -right-[3px] top-24 w-[3px] h-11 bg-[#475569] rounded-r-xs shadow-xs" />

                {/* iPhone Titanium Chassis Outer Frame */}
                <div className="bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] rounded-t-[44px] p-[5px] pb-0 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4),0_0_0_1px_rgba(255,255,255,0.15)] relative">
                  
                  {/* Speaker Ear-piece Micro Slit */}
                  <div className="w-10 h-[3px] bg-[#090d16] rounded-full mx-auto mb-1.5 opacity-80" />

                  {/* Super Retina XDR OLED Screen */}
                  <div className="bg-[#f8fafc] rounded-t-[38px] text-slate-900 h-[360px] flex flex-col justify-between overflow-hidden relative shadow-inner select-none border border-slate-200/50 text-[9px]">
                    
                    {/* iOS Status Bar + Dynamic Island */}
                    <div className="pt-2 px-3.5 flex items-center justify-between relative z-20 bg-blue-50/40 backdrop-blur-xs">
                      <span className="text-[10px] font-bold tracking-tight text-slate-900 font-sans">9:41</span>
                      
                      <div className="w-18 h-[18px] bg-black rounded-full flex items-center justify-between px-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[#0a0a0f] ring-1 ring-white/20 flex items-center justify-center">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#1e40af]" />
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                      </div>

                      <div className="flex items-center gap-1 text-slate-900">
                        <div className="flex items-end gap-[1px] h-2">
                          <span className="w-[1.5px] h-1 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-1.5 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-2 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-2.5 bg-slate-900 rounded-3xs" />
                        </div>
                        <span className="text-[7px] font-bold font-mono">5G</span>
                        <div className="w-4 h-2 border border-slate-900 rounded-[2px] p-[1px] flex items-center">
                          <span className="w-[85%] h-full bg-[#10b981] rounded-[1px] block" />
                        </div>
                      </div>
                    </div>

                    {/* App Header: Kiosk ID + Help Button */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200/80 bg-blue-50/40">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-black text-[7.5px] shadow-2xs">
                          RIT
                        </div>
                        <div className="leading-tight">
                          <div className="text-[9px] font-black text-slate-900 flex items-center gap-0.5">
                            Kiosk #021548 <span className="text-[8px] text-slate-500">▾</span>
                          </div>
                          <div className="text-[7px] text-slate-500 font-semibold">Library Kiosk</div>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded-lg border border-slate-300/80 bg-white text-slate-700 text-[8px] font-bold flex items-center gap-1 shadow-2xs">
                        <HelpCircle className="w-2.5 h-2.5 text-slate-500" />
                        <span>Help</span>
                      </div>
                    </div>

                    {/* Main UI: Settings Form */}
                    <div className="p-3 flex-1 flex flex-col justify-between bg-white space-y-2">
                      
                      {/* Settings Card */}
                      <div className="p-2.5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                        
                        {/* Copies Stepper Row */}
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-slate-800">Number of Copies</span>
                          <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-blue-100/70 text-[#2563eb] text-[8px] font-extrabold">
                            <span className="cursor-pointer">−</span>
                            <span className="text-slate-900">1</span>
                            <span className="cursor-pointer">+</span>
                          </div>
                        </div>

                        {/* B/W vs Color Radio Cards */}
                        <div className="grid grid-cols-2 gap-1.5">
                          
                          {/* B/W Card */}
                          <div className="p-1.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between h-14 relative cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="text-[7.5px] font-extrabold text-slate-800">B/W</span>
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-300" />
                            </div>
                            <div className="flex -space-x-1 mt-auto">
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-400 block opacity-80" />
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 block" />
                            </div>
                          </div>

                          {/* Color Card */}
                          <div className="p-1.5 rounded-xl border-2 border-[#2563eb] bg-blue-50/50 flex flex-col justify-between h-14 relative cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="text-[7.5px] font-extrabold text-[#2563eb]">Color</span>
                              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#2563eb] flex items-center justify-center">
                                <span className="w-1 h-1 rounded-full bg-[#2563eb]" />
                              </span>
                            </div>
                            <div className="flex -space-x-1 mt-auto">
                              <span className="w-3.5 h-3.5 rounded-full bg-sky-400 block opacity-90" />
                              <span className="w-3.5 h-3.5 rounded-full bg-pink-500 block opacity-90" />
                              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 block opacity-90" />
                            </div>
                          </div>

                        </div>

                        {/* Duplex Options */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="p-1 rounded-lg border border-slate-200 text-center text-[7px] font-bold text-slate-700 flex items-center justify-center gap-1">
                            <span>Double-sided</span>
                            <FileText className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                          <div className="p-1 rounded-lg border border-slate-200 text-center text-[7px] font-bold text-slate-700 flex items-center justify-center gap-1">
                            <span>Single-sided</span>
                            <FileText className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                        </div>

                        {/* Orientation */}
                        <div className="space-y-1">
                          <div className="text-[7px] font-bold text-slate-500">Orientation</div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="p-1 rounded-lg border border-slate-200 text-center text-[7px] font-bold text-slate-700 flex items-center justify-center gap-1">
                              <span>Portrait</span>
                              <FileText className="w-2.5 h-2.5 text-slate-400" />
                            </div>
                            <div className="p-1 rounded-lg border border-slate-200 text-center text-[7px] font-bold text-slate-700 flex items-center justify-center gap-1">
                              <span>Landscape</span>
                              <FileText className="w-2.5 h-2.5 text-slate-400 rotate-90" />
                            </div>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <div className="flex items-center gap-1 text-[7px] text-slate-600 font-medium pt-0.5">
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block" />
                          <span>Apply same settings to all files</span>
                        </div>

                      </div>

                      {/* Bottom Button: Upload */}
                      <button className="w-full py-2 rounded-xl bg-[#2563eb] text-white font-black text-[9px] shadow-md shadow-blue-500/25 flex items-center justify-center">
                        Upload
                      </button>

                    </div>

                    {/* iOS Home Indicator Bar */}
                    <div className="py-1 bg-white flex justify-center">
                      <div className="w-20 h-1 bg-slate-300 rounded-full" />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 4: STEP 4 (PRINT CODE IS READY) ── */}
          <div className="rounded-[2.5rem] bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e40af] p-5 sm:p-6 text-white flex flex-col justify-between shadow-2xl shadow-blue-700/30 overflow-hidden group hover:-translate-y-2 transition-all duration-300 relative border border-blue-400/20">
            
            {/* Top Text Content */}
            <div className="text-center space-y-2.5 pb-6">
              <span className="inline-block px-5 py-1.5 rounded-full bg-white text-[#2563eb] font-extrabold text-xs tracking-wider shadow-md uppercase">
                Step 4
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Get Your Print Instantly
              </h3>
              <p className="text-xs sm:text-[13px] text-blue-100 font-normal leading-relaxed">
                Enter the 4-digit PIN or scan the dynamic QR on Kiosk to instantly receive your print.
              </p>
            </div>

            {/* Ultra-Realistic Titanium iPhone 16 Pro Mockup */}
            <div className="mt-auto pt-2 flex justify-center">
              <div className="w-full max-w-[245px] relative">
                
                {/* Physical Titanium Hardware Side Buttons */}
                <div className="absolute -left-[3px] top-16 w-[3px] h-3.5 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -left-[3px] top-24 w-[3px] h-7 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -left-[3px] top-34 w-[3px] h-7 bg-[#475569] rounded-l-xs shadow-xs" />
                <div className="absolute -right-[3px] top-24 w-[3px] h-11 bg-[#475569] rounded-r-xs shadow-xs" />

                {/* iPhone Titanium Chassis Outer Frame */}
                <div className="bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] rounded-t-[44px] p-[5px] pb-0 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4),0_0_0_1px_rgba(255,255,255,0.15)] relative">
                  
                  {/* Speaker Ear-piece Micro Slit */}
                  <div className="w-10 h-[3px] bg-[#090d16] rounded-full mx-auto mb-1.5 opacity-80" />

                  {/* Super Retina XDR OLED Screen */}
                  <div className="bg-[#f8fafc] rounded-t-[38px] text-slate-900 h-[360px] flex flex-col justify-between overflow-hidden relative shadow-inner select-none border border-slate-200/50 text-[9px]">
                    
                    {/* iOS Status Bar + Dynamic Island */}
                    <div className="pt-2 px-3.5 flex items-center justify-between relative z-20 bg-blue-50/40 backdrop-blur-xs">
                      <span className="text-[10px] font-bold tracking-tight text-slate-900 font-sans">9:41</span>
                      
                      <div className="w-18 h-[18px] bg-black rounded-full flex items-center justify-between px-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[#0a0a0f] ring-1 ring-white/20 flex items-center justify-center">
                          <span className="w-0.5 h-0.5 rounded-full bg-[#1e40af]" />
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                      </div>

                      <div className="flex items-center gap-1 text-slate-900">
                        <div className="flex items-end gap-[1px] h-2">
                          <span className="w-[1.5px] h-1 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-1.5 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-2 bg-slate-900 rounded-3xs" />
                          <span className="w-[1.5px] h-2.5 bg-slate-900 rounded-3xs" />
                        </div>
                        <span className="text-[7px] font-bold font-mono">5G</span>
                        <div className="w-4 h-2 border border-slate-900 rounded-[2px] p-[1px] flex items-center">
                          <span className="w-[85%] h-full bg-[#10b981] rounded-[1px] block" />
                        </div>
                      </div>
                    </div>

                    {/* App Header: Logo + Help Button */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200/80 bg-blue-50/40">
                      <div className="flex items-center gap-1.5">
                        <img src="/rit-logo.png" alt="RIT" className="h-4 w-auto object-contain max-w-[75px]" />
                        <span className="text-[11px] font-black text-slate-900 tracking-tight">
                          Smart<span className="text-[#2563eb]">Print</span>
                        </span>
                      </div>
                      <div className="px-2 py-0.5 rounded-lg border border-slate-300/80 bg-white text-slate-700 text-[8px] font-bold flex items-center gap-1 shadow-2xs">
                        <HelpCircle className="w-2.5 h-2.5 text-slate-500" />
                        <span>Help</span>
                      </div>
                    </div>

                    {/* Main UI: Print Code Ready Pass */}
                    <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                      
                      {/* Back & Countdown Bar */}
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-600 flex items-center gap-0.5 cursor-pointer">
                          ← Back
                        </span>
                        <div className="px-2 py-0.5 rounded-md bg-[#10b981] text-white font-mono text-[8px] font-extrabold flex items-center gap-1 shadow-2xs">
                          <Clock className="w-2.5 h-2.5" />
                          <span>59:00</span>
                        </div>
                      </div>

                      {/* Header Text */}
                      <div className="text-center space-y-0.5">
                        <h4 className="text-[11px] font-black text-slate-900 tracking-tight">
                          Your Print Code is Ready!
                        </h4>
                        <p className="text-[7px] text-slate-500 font-medium leading-tight">
                          Use this QR code or PIN at any SmartPrint kiosk within 24 hours.
                        </p>
                      </div>

                      {/* Center QR Matrix */}
                      <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs mx-auto">
                        <svg viewBox="0 0 100 100" className="w-20 h-20" fill="currentColor">
                          <rect x="5" y="5" width="28" height="28" rx="2" fill="#0f172a" />
                          <rect x="9" y="9" width="20" height="20" rx="1" fill="#ffffff" />
                          <rect x="13" y="13" width="12" height="12" fill="#0f172a" />
                          <rect x="67" y="5" width="28" height="28" rx="2" fill="#0f172a" />
                          <rect x="71" y="9" width="20" height="20" rx="1" fill="#ffffff" />
                          <rect x="75" y="13" width="12" height="12" fill="#0f172a" />
                          <rect x="5" y="67" width="28" height="28" rx="2" fill="#0f172a" />
                          <rect x="9" y="71" width="20" height="20" rx="1" fill="#ffffff" />
                          <rect x="13" y="75" width="12" height="12" fill="#0f172a" />
                          <rect x="71" y="71" width="20" height="20" rx="1.5" fill="#0f172a" />
                          <rect x="75" y="75" width="12" height="12" fill="#ffffff" />
                          <rect x="79" y="79" width="4" height="4" fill="#0f172a" />
                          <rect x="37" y="17" width="4" height="4" fill="#0f172a" />
                          <rect x="45" y="17" width="4" height="4" fill="#0f172a" />
                          <rect x="53" y="17" width="4" height="4" fill="#0f172a" />
                          <rect x="61" y="17" width="4" height="4" fill="#0f172a" />
                          <rect x="17" y="37" width="4" height="4" fill="#0f172a" />
                          <rect x="17" y="45" width="4" height="4" fill="#0f172a" />
                          <rect x="17" y="53" width="4" height="4" fill="#0f172a" />
                          <rect x="17" y="61" width="4" height="4" fill="#0f172a" />
                          <rect x="37" y="5" width="4" height="4" fill="#0f172a" />
                          <rect x="45" y="5" width="8" height="4" fill="#0f172a" />
                          <rect x="57" y="5" width="4" height="4" fill="#0f172a" />
                          <rect x="37" y="9" width="8" height="4" fill="#0f172a" />
                          <rect x="53" y="9" width="4" height="4" fill="#0f172a" />
                          <rect x="61" y="9" width="4" height="4" fill="#0f172a" />
                          <rect x="41" y="13" width="4" height="4" fill="#0f172a" />
                          <rect x="49" y="13" width="8" height="4" fill="#0f172a" />
                          <rect x="5" y="37" width="8" height="4" fill="#0f172a" />
                          <rect x="25" y="37" width="4" height="4" fill="#0f172a" />
                          <rect x="37" y="37" width="4" height="4" fill="#0f172a" />
                          <rect x="57" y="37" width="8" height="4" fill="#0f172a" />
                          <rect x="69" y="37" width="4" height="4" fill="#0f172a" />
                          <rect x="81" y="37" width="8" height="4" fill="#0f172a" />
                          <rect x="9" y="41" width="4" height="4" fill="#0f172a" />
                          <rect x="21" y="41" width="8" height="4" fill="#0f172a" />
                          <rect x="69" y="41" width="8" height="4" fill="#0f172a" />
                          <rect x="89" y="41" width="4" height="4" fill="#0f172a" />
                          <rect x="5" y="49" width="4" height="4" fill="#0f172a" />
                          <rect x="25" y="49" width="8" height="4" fill="#0f172a" />
                          <rect x="69" y="49" width="4" height="4" fill="#0f172a" />
                          <rect x="81" y="49" width="4" height="4" fill="#0f172a" />
                          <rect x="89" y="49" width="4" height="4" fill="#0f172a" />
                          <rect x="9" y="57" width="8" height="4" fill="#0f172a" />
                          <rect x="21" y="57" width="4" height="4" fill="#0f172a" />
                          <rect x="37" y="57" width="8" height="4" fill="#0f172a" />
                          <rect x="57" y="57" width="4" height="4" fill="#0f172a" />
                          <rect x="69" y="57" width="8" height="4" fill="#0f172a" />
                          <rect x="85" y="57" width="4" height="4" fill="#0f172a" />
                          <rect x="37" y="69" width="8" height="4" fill="#0f172a" />
                          <rect x="53" y="69" width="4" height="4" fill="#0f172a" />
                          <rect x="61" y="69" width="4" height="4" fill="#0f172a" />
                          <rect x="41" y="73" width="4" height="4" fill="#0f172a" />
                          <rect x="49" y="73" width="8" height="4" fill="#0f172a" />
                          <rect x="37" y="81" width="4" height="4" fill="#0f172a" />
                          <rect x="45" y="81" width="8" height="4" fill="#0f172a" />
                          <rect x="57" y="81" width="4" height="4" fill="#0f172a" />
                          <rect x="37" y="89" width="8" height="4" fill="#0f172a" />
                          <rect x="49" y="89" width="4" height="4" fill="#0f172a" />
                          <rect x="57" y="89" width="8" height="4" fill="#0f172a" />
                        </svg>
                      </div>

                      {/* Download Button */}
                      <button className="w-full py-1.5 rounded-xl bg-[#2563eb] text-white font-black text-[9px] shadow-sm flex items-center justify-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>

                      {/* View OTP + Share Buttons */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button className="py-1 rounded-lg border border-[#2563eb] text-[#2563eb] font-bold text-[7.5px] bg-blue-50/40">
                          View PIN: 8429
                        </button>
                        <button className="py-1 rounded-lg border border-slate-200 text-slate-700 font-bold text-[7.5px] bg-white flex items-center justify-center gap-1">
                          <span className="text-emerald-500 font-bold">💬</span>
                          <span>Share</span>
                        </button>
                      </div>

                    </div>

                    {/* iOS Home Indicator Bar */}
                    <div className="py-1 bg-white flex justify-center">
                      <div className="w-20 h-1 bg-slate-300 rounded-full" />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FEATURES SECTION (CAMPUS DEPLOYMENT FEASIBILITY & BENEFITS) ── */}
      <section id="features" className="py-14 sm:py-24 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 sm:space-y-14 reveal-on-scroll">
        
        {/* Section Header */}
        <div className="text-center space-y-2.5 sm:space-y-3 max-w-3xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/40 bg-blue-50 text-[#1d4ed8] text-xs font-extrabold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>Campus Feasibility &amp; Benefits</span>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight [text-wrap:balance]">
            Why <span className="text-[#2563eb]">SmartPrint</span> is Engineered for RIT Campus
          </h2>
          
          <p className="text-xs sm:text-base text-slate-500 font-medium">
            Autonomous, zero-queue laser printing tailored for student submissions, lab workflows &amp; 24/7 campus living.
          </p>
        </div>

        {/* 6 Grid Cards with Blueprint Grid Texture */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Card 1: Zero Data Leak & Instant RAM Wipe */}
          <div className="rounded-3xl bg-white border-2 border-emerald-500/80 p-5 sm:p-7 space-y-3.5 sm:space-y-4 shadow-sm hover:shadow-xl transition-all duration-300 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Zero Data Leak &amp; Instant Memory Wipe
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Lab records, hall tickets, and assignment files are encrypted during upload and permanently purged from kiosk memory right after printing. No saved history or file leaks.
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute bottom-5 sm:bottom-6 right-5 sm:right-6 shadow-xs" />
          </div>

          {/* Card 2: 30-Second Morning Rush-Hour Speed */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 space-y-3.5 sm:space-y-4 shadow-sm hover:shadow-xl hover:border-[#2563eb] transition-all duration-300 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#2563eb] flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 text-[#2563eb] stroke-[2.5]" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                30-Second Rush-Hour Prints
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Never get locked out of lab sessions due to xerox center bottlenecks. High-speed laser spooling delivers your document output in under 30 seconds before 8:30 AM class entry.
              </p>
            </div>
          </div>

          {/* Card 3: 24/7 Access for Hostellers & Exam Nights */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 space-y-3.5 sm:space-y-4 shadow-sm hover:shadow-xl hover:border-[#2563eb] transition-all duration-300 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                24/7 Hostel &amp; Academic Radar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Available throughout late-night project reviews, semester exam preps, and Sundays when offline reprography stores on campus and outer gates remain shut.
              </p>
            </div>
          </div>

          {/* Card 4: 100% Contactless Mobile QR (No Pen Drives) */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 space-y-3.5 sm:space-y-4 shadow-sm hover:shadow-xl hover:border-[#2563eb] transition-all duration-300 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#2563eb] flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5 text-[#2563eb] stroke-[2.5]" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Zero Pen Drive Viruses &amp; Queues
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                No risky USB pen drives, corrupted shortcut viruses, or sharing WhatsApp files with third-party store operators. Your mobile phone acts as your private print trigger.
              </p>
            </div>
          </div>

          {/* Card 5: Academic Multi-Format & Auto-Duplex */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 space-y-3.5 sm:space-y-4 shadow-sm hover:shadow-xl hover:border-[#2563eb] transition-all duration-300 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Academic Multi-Format Spooling
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Native engine support for IEEE paper PDFs, Word lab manuals, PowerPoint slides, and circuit diagrams with automatic duplex (double-sided) paper conservation.
              </p>
            </div>
          </div>

          {/* Card 6: Subsidized Student UPI Micro-Payments */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 space-y-3.5 sm:space-y-4 shadow-sm hover:shadow-xl hover:border-[#2563eb] transition-all duration-300 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#2563eb] flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-[#2563eb] stroke-[2.5]" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Subsidized Student Micro-Pricing
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Seamless ₹2/page dynamic UPI payments with GPay, PhonePe, or Paytm. No minimum balance recharges, membership lock-ins, or loose coin change troubles.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── SMARTER VS TRADITIONAL COMPARISON SECTION ── */}
      <section id="comparison" className="py-14 sm:py-24 max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 sm:space-y-14 reveal-on-scroll">
        
        {/* Section Header */}
        <div className="text-center space-y-2.5 sm:space-y-3.5 max-w-3xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 xs:px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-50 text-[#1d4ed8] text-xs font-extrabold tracking-wide shadow-2xs">
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#2563eb] stroke-[2.5]" />
              <span>Smarter vs Traditional</span>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight [text-wrap:balance]">
            And, why <span className="text-[#2563eb]">SmartPrint</span> stands out?
          </h2>
          
          <p className="text-xs sm:text-base text-slate-500 font-medium">
            Self-Service Autonomous Kiosks vs. Traditional Campus Xerox Shops
          </p>
        </div>

        {/* 2-Column Comparison Card with Premium Frame & Aura */}
        <div className="rounded-[24px] xs:rounded-[32px] sm:rounded-[40px] bg-white border border-slate-200 shadow-2xl p-4 xs:p-6 sm:p-10 lg:p-12 relative overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
          
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-stretch relative z-10">
            
            {/* Left Column: Traditional Print Shops */}
            <div className="p-2 sm:p-6 space-y-4 sm:space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mb-5 sm:mb-7 flex items-center gap-2.5">
                  <span>Traditional Print Shops</span>
                </h3>

                <ul className="space-y-3.5 sm:space-y-5">
                  {[
                    { title: 'Limited Working Hours', desc: 'Closed early mornings, late nights & exam holidays' },
                    { title: 'Long queues and delayed service', desc: '30+ minute morning rush bottlenecks before lab entry' },
                    { title: 'Files often visible to shop staff', desc: 'Personal documents, certificates & hall tickets exposed' },
                    { title: 'Shopkeepers often download to print', desc: 'Files remain saved on public shared desktops' },
                    { title: 'Requires staff interaction', desc: 'Cash change hassles, manual sorting & delays' },
                    { title: 'USB Pen Drive Malware Risk', desc: 'Shortcut viruses spread across college computers' }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border border-red-300 bg-red-50 text-red-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <X className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-red-500 stroke-[3]" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800 block">
                          {item.title}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-400 font-normal block leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: SmartPrint Autonomous Kiosks (Elevated Royal Blue Highlighted Box) */}
            <div className="rounded-2xl xs:rounded-3xl sm:rounded-[32px] bg-gradient-to-b from-blue-500/[0.04] to-blue-500/[0.01] bg-white border-2 border-[#2563eb] p-4 xs:p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-xl shadow-blue-500/10 relative flex flex-col justify-between hover:border-[#1d4ed8] transition-all">
              <div>
                {/* Clean Logo Header without Overlap */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pb-4 sm:pb-5 border-b border-blue-500/20 mb-4 sm:mb-6 gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <img
                      src="/rit-logo.png"
                      alt="Rajalakshmi Institute of Technology"
                      className="h-5 xs:h-6 sm:h-7 w-auto max-w-[80px] xs:max-w-[90px] sm:max-w-[100px] object-contain block shrink-0"
                    />
                    <div className="h-4 w-px bg-blue-500/30 shrink-0" />
                    <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight font-sans">
                        Smart<span className="text-[#2563eb]">Print</span>
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse shadow-sm shadow-blue-500/60" />
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#2563eb] text-white font-mono text-[9px] xs:text-[10px] sm:text-[11px] font-extrabold tracking-wide shadow-xs shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    RIT CAMPUS
                  </span>
                </div>

                <ul className="space-y-3.5 sm:space-y-5">
                  {[
                    { title: '24x7 Campus & Hostel Access', desc: 'Available anytime during late-night exam preps & Sundays' },
                    { title: 'Instant prints under 30 seconds', desc: 'Lightning-fast cloud laser spooling with zero queue delay' },
                    { title: 'Private, encrypted & auto-deleted', desc: 'Purged permanently from kiosk memory immediately after print' },
                    { title: 'No one downloads your file', desc: 'Direct encrypted mobile-to-printer hardware stream' },
                    { title: 'No human interaction needed', desc: '100% contactless flow via dynamic UPI (GPay / PhonePe / Paytm)' },
                    { title: 'Zero Pen Drive Viruses', desc: 'Scan QR & upload directly from phone—no USB sticks needed' }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border border-blue-500 bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#2563eb] stroke-[3]" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                          {item.title}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-500 font-medium block leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section id="faq" className="py-12 sm:py-28 max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-10 reveal-on-scroll">
        <div className="text-center space-y-2 sm:space-y-3">
          <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] sm:text-xs font-mono font-bold shadow-2xs">
            CAMPUS ASSISTANCE
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How do I print my Lab Records or Assignments using RIT SmartPrint?',
              a: 'Open this portal on your mobile or laptop, upload your document, select B&W or Color settings, complete UPI payment, and receive your 4-digit PIN. Walk up to the nearest kiosk (Library, CSE Lab, or Hostel), punch your 4-digit PIN on the touchscreen, and grab your fresh prints instantly!'
            },
            {
              q: 'Where are the SmartPrint Kiosks located in RIT campus?',
              a: 'Kiosks are operational at the Central Library Ground Floor, CSE & IT Lab Complex (Block B), and Hostel Common Hall for 24/7 night access.'
            },
            {
              q: 'Is my document privacy secure?',
              a: 'Yes, 100%! Documents are encrypted in transit and purged with cryptographic zero-shredding the exact millisecond printing completes at the hardware terminal.'
            },
            {
              q: 'What file formats are supported?',
              a: 'PDF (.pdf), Microsoft Word (.docx, .doc), PowerPoint (.pptx), Excel (.xlsx), and high-resolution images (.jpg, .png).'
            }
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`glass-panel rounded-xl sm:rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen ? 'border-[#2563eb]/50 ring-2 ring-[#2563eb]/10' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-5 text-left flex items-center justify-between gap-3 font-extrabold text-xs sm:text-base text-slate-900 cursor-pointer"
                >
                  <span className={isOpen ? 'text-[#2563eb]' : ''}>{item.q}</span>
                  <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isOpen ? 'bg-[#2563eb] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isOpen ? <Minus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" /> : <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-normal">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CLEAN WHITE FOOTER (MATCHING REFERENCE DESIGN) ── */}
      <footer className="bg-white border-t border-slate-200/90 pt-12 sm:pt-16 pb-8 sm:pb-10 text-xs sm:text-sm text-slate-600 reveal-on-scroll">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
          
          <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-16">
            
            {/* Left Brand & CTA Column */}
            <div className="space-y-4 max-w-md">
              <Logo size="md" />
              
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Autonomous Self-Service Printing Kiosks for Students &amp; Faculty.
              </p>
              
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse" />
                  <span>Ready to print? Upload from your phone and collect in 30 seconds.</span>
                </p>

                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all"
                >
                  <span>Print Document</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Navigation Columns */}
            <div className="grid grid-cols-2 gap-8 sm:gap-16 lg:gap-24">
              
              {/* Navigation Links */}
              <div className="space-y-3">
                <h4 className="text-slate-900 font-bold text-sm tracking-tight">Navigation</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-500 font-medium">
                  <li><a href="#how-it-works" className="hover:text-[#2563eb] transition-colors">How It Works</a></li>
                  <li><a href="#features" className="hover:text-[#2563eb] transition-colors">Features</a></li>
                  <li><a href="#comparison" className="hover:text-[#2563eb] transition-colors">Smarter vs Traditional</a></li>
                  <li><a href="#faq" className="hover:text-[#2563eb] transition-colors">FAQ &amp; Support</a></li>
                  <li><Link href="/upload" className="hover:text-[#2563eb] transition-colors">Student Uploader</Link></li>
                </ul>
              </div>

              {/* Support & Legal */}
              <div className="space-y-3">
                <h4 className="text-slate-900 font-bold text-sm tracking-tight">Support</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-500 font-medium">
                  <li><a href="#faq" className="hover:text-[#2563eb] transition-colors">Help Center</a></li>
                  <li><a href="#faq" className="hover:text-[#2563eb] transition-colors">Privacy &amp; Security</a></li>
                  <li><a href="#faq" className="hover:text-[#2563eb] transition-colors">Terms of Service</a></li>
                </ul>
              </div>

            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-6 sm:pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium text-center sm:text-left">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span>© 2026 SmartPrint</span>
              <span className="text-slate-300">•</span>
              <span>All Rights Reserved</span>
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-400">
              <a href="#faq" className="hover:text-slate-600 transition-colors">Terms &amp; Conditions</a>
              <a href="#faq" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
