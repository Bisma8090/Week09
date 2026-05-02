import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showText?: boolean;
}

export default function Logo({ size = 'md', variant = 'dark', showText = true }: LogoProps) {
  const dims = { sm: 32, md: 40, lg: 56 };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
  const d = dims[size];
  const textColor = variant === 'light' ? 'white' : '#1a3a06';
  const subColor = variant === 'light' ? 'rgba(255,255,255,0.75)' : '#6a9e2f';

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Icon mark */}
      <svg width={d} height={d} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a8d85a" />
            <stop offset="100%" stopColor="#4d8c1a" />
          </linearGradient>
          <linearGradient id="pulseGrad" x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="50%" stopColor="white" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
          </linearGradient>
        </defs>

        {/* Background pill */}
        <rect width="40" height="40" rx="12" fill="url(#logoGrad)" />

        {/* Subtle inner glow */}
        <rect width="40" height="40" rx="12" fill="white" fillOpacity="0.07" />

        {/* ECG / heartbeat line */}
        <polyline
          points="4,22 9,22 12,14 15,28 18,18 21,22 24,22 27,10 30,28 33,22 36,22"
          stroke="url(#pulseGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {showText && (
        <div className="leading-none">
          <div className={`font-black tracking-tight ${textSizes[size]}`} style={{ color: textColor }}>
            Health<span style={{ color: variant === 'light' ? 'rgba(255,255,255,0.85)' : '#6a9e2f' }}>Care</span>
          </div>
          <div
            className="font-semibold uppercase tracking-[0.18em]"
            style={{
              fontSize: size === 'lg' ? '0.6rem' : '0.55rem',
              color: subColor,
              marginTop: 1,
            }}>
            Shop
          </div>
        </div>
      )}
    </div>
  );
}
