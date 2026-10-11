import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: { imgHClass: 'h-[18px] sm:h-[22px]', font: 'text-xs sm:text-sm' },
    md: { imgHClass: 'h-[20px] sm:h-[26px]', font: 'text-xs sm:text-base' },
    lg: { imgHClass: 'h-[26px] sm:h-[32px]', font: 'text-sm sm:text-lg' },
  };

  const s = sizes[size];

  return (
    <Link href="/" className={`inline-flex items-center shrink-0 whitespace-nowrap select-none group ${className}`}>
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-500/40 hover:shadow-xs transition-all duration-200 shrink-0">
        {/* Official College Crest Image (Clean High-DPI Emblem) */}
        <img
          src="/rit-emblem.png"
          alt="Rajalakshmi Institute of Technology"
          className={`${s.imgHClass} w-auto object-contain block shrink-0`}
        />
        
        {/* Vertical Divider Line */}
        <div className="h-3.5 sm:h-4.5 w-px bg-slate-200 shrink-0" />
        
        {/* SmartPrint Brand Text + Royal Blue Pulsing Dot */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
          <span className={`font-black tracking-tight text-slate-900 font-sans ${s.font}`}>
            Smart<span className="text-[#2563eb]">Print</span>
          </span>
          <span className="flex h-1.5 sm:h-2 w-1.5 sm:w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 sm:h-2 w-1.5 sm:w-2 bg-[#2563eb]" />
          </span>
        </div>
      </div>
    </Link>
  );
}
