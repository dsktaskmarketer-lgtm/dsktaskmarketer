import React from 'react';

interface SecurityTrustIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SecurityTrustIllustration: React.FC<SecurityTrustIllustrationProps> = ({
  className = '',
  size = 'md'
}) => {
  const maxW = {
    sm: 'max-w-[160px]',
    md: 'max-w-[240px]',
    lg: 'max-w-[320px]'
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 320 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-auto ${maxW} overflow-visible`}
      >
        <defs>
          <linearGradient id="sec-shield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          <filter id="sec-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Ambient Ring */}
        <circle cx="160" cy="130" r="90" fill="#EFF6FF" />
        <circle cx="160" cy="130" r="70" fill="#DBEAFE" opacity="0.6" />

        {/* Big Royal Blue Security Shield in Center */}
        <g transform="translate(110, 45)" filter="url(#sec-shadow)">
          <path
            d="M50 0 L95 20 C95 70, 75 115, 50 135 C25 115, 5 70, 5 20 Z"
            fill="url(#sec-shield)"
            stroke="#60A5FA"
            strokeWidth="3"
          />
          {/* Inner Shield Accent */}
          <path
            d="M50 12 L85 28 C85 68, 68 102, 50 120 C32 102, 15 68, 15 28 Z"
            fill="#1D4ED8"
          />
          {/* Big Golden Keyhole / Checkmark */}
          <circle cx="50" cy="55" r="16" fill="#FFD600" />
          <path
            d="M44 55 L48 60 L57 49"
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="46" y="68" width="8" height="14" rx="3" fill="#FFD600" />
        </g>

        {/* Left Floating Safe Padlock */}
        <g transform="translate(45, 90) rotate(-10)" filter="url(#sec-shadow)">
          <path d="M12 16 V10 C12 4.5, 17.5 0, 24 0 C30.5 0, 36 4.5, 36 10 V16" stroke="#94A3B8" strokeWidth="4" fill="none" />
          <rect x="0" y="14" width="48" height="36" rx="8" fill="#E11D2E" />
          <circle cx="24" cy="30" r="4" fill="#FFD600" />
          <rect x="22" y="32" width="4" height="8" rx="2" fill="#FFD600" />
        </g>

        {/* Right Floating Verified Badge */}
        <g transform="translate(225, 95) rotate(12)" filter="url(#sec-shadow)">
          <circle cx="22" cy="22" r="22" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M14 22 L20 28 L30 16" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* 100% Genuine Ribbon */}
        <g transform="translate(100, 205)" filter="url(#sec-shadow)">
          <rect x="0" y="0" width="120" height="28" rx="14" fill="#FFD600" />
          <text x="60" y="18" fontSize="11" fontWeight="900" fill="#78350F" textAnchor="middle" letterSpacing="0.5">
            100% SECURE & AUDITED
          </text>
        </g>
      </svg>
    </div>
  );
};
