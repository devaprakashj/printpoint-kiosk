import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTagline?: boolean;
}

export default function Logo({ size = 'md', className = '', showTagline = true }: LogoProps) {
  const iconSizes = {
    sm: { box: 34, font: 'text-xl', tag: 'text-[8px]', gap: 'gap-2.5' },
    md: { box: 44, font: 'text-2xl sm:text-[26px]', tag: 'text-[9px]', gap: 'gap-3' },
    lg: { box: 54, font: 'text-3xl', tag: 'text-[10px]', gap: 'gap-3.5' },
  };

  const current = iconSizes[size];

  return (
    <Link href="/" className={`inline-flex items-center ${current.gap} select-none group ${className}`}>
      {/* High-Tech Vector Icon */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00cf27] via-[#00a61c] to-[#007a13] p-1.5 shadow-md shadow-emerald-600/25 border border-white/40 group-hover:scale-105 transition-transform duration-200"
        style={{ width: current.box, height: current.box }}
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Top Paper Input */}
          <rect x="13" y="6" width="22" height="11" rx="2.5" fill="#ffffff" fillOpacity="0.95" />
          {/* Printer Body Slot */}
          <rect x="7" y="15" width="34" height="14" rx="3.5" fill="#042712" />
          <rect x="11" y="21" width="26" height="2" rx="1" fill="#4ade80" />
          {/* Dispensed Page */}
          <path d="M14 22H34V39C34 40.5 32.8 41.5 31.3 41.5H16.7C15.2 41.5 14 40.5 14 39V22Z" fill="#ffffff" />
          <line x1="18" y1="28" x2="28" y2="28" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="32" x2="30" y2="32" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="36" x2="24" y2="36" stroke="#00a61c" strokeWidth="1.5" strokeLinecap="round" />
          {/* Beacon Point */}
          <circle cx="37" cy="18" r="1.8" fill="#22c55e" />
        </svg>
      </div>

      {/* Typography: PrintPoint */}
      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-tight text-[#050505] font-sans ${current.font}`}>
          Print<span className="text-[#00a61c]">Point</span>
        </span>
        {showTagline && (
          <span className={`font-extrabold uppercase tracking-[0.22em] text-[#16a34a] mt-0.5 ${current.tag}`}>
            CLOUD ATM NETWORK
          </span>
        )}
      </div>
    </Link>
  );
}
