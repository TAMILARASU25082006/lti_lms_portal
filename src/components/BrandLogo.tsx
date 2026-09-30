import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  lightMode?: boolean; // if true, text is white for dark navbar
}

export function BrandLogo({ className = '', showText = true, lightMode = false }: BrandLogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 transition-opacity hover:opacity-95 ${className}`}>
      {/* Academy Crest / Geometric Icon */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-950 via-navy-900 to-blue-600 shadow-md border border-blue-500/20">
        <svg
          className="w-5 h-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-navy-950" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`text-lg font-bold tracking-tight leading-tight ${lightMode ? 'text-white' : 'text-navy-900'}`}>
            Company <span className="text-blue-600">Academy</span>
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${lightMode ? 'text-slate-300' : 'text-slate-500'}`}>
            Enterprise Learning
          </span>
        </div>
      )}
    </Link>
  );
}

export default BrandLogo;
