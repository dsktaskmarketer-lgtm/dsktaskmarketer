import React from 'react';

// ==========================================
// 3D FLOATING GOLD COIN
// Realistic metallic gold coin with bevel,
// rupee symbol (₹), specular glint, and depth
// ==========================================
interface FloatingCoin3DProps {
  size?: number; // size in px
  className?: string;
  delay?: string;
  duration?: string;
  tilt?: number; // deg
  label?: string;
}

export const FloatingCoin3D: React.FC<FloatingCoin3DProps> = ({
  size = 48,
  className = '',
  delay = '0s',
  duration = '4s',
  tilt = 12,
  label = '₹'
}) => {
  return (
    <div
      className={`inline-block select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(255,196,0,0.45)] transition-transform ${className}`}
      style={{
        width: size,
        height: size,
        transform: `perspective(400px) rotateY(${tilt}deg) rotateX(${tilt / 2}deg)`,
        animation: `coinFloat ${duration} ease-in-out infinite alternate`,
        animationDelay: delay
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
      >
        <defs>
          {/* Coin Outer Rim Gradient */}
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF275" />
            <stop offset="25%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="75%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Coin Inner Face Gradient */}
          <radialGradient id="goldFace" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#FBBF24" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="95%" stopColor="#B45309" />
          </radialGradient>

          {/* Specular Highlight Glint */}
          <linearGradient id="specularGlint" x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 3D Coin Edge Depth Layer */}
        <circle cx="50" cy="54" r="44" fill="#78350F" opacity="0.9" />
        <circle cx="50" cy="52" r="44" fill="#92400E" />

        {/* Coin Outer Beveled Ring */}
        <circle cx="50" cy="50" r="44" fill="url(#goldRim)" stroke="#FEF08A" strokeWidth="2.5" />

        {/* Inner Groove */}
        <circle cx="50" cy="50" r="37" fill="url(#goldFace)" stroke="#FDE047" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="#B45309" strokeWidth="1" strokeDasharray="3 2" />

        {/* Rupee / Currency Symbol */}
        <text
          x="50"
          y="61"
          textAnchor="middle"
          fontSize="36"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#78350F"
        >
          {label}
        </text>
        <text
          x="49"
          y="59.5"
          textAnchor="middle"
          fontSize="36"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#FFFBEB"
        >
          {label}
        </text>

        {/* Diagonal Specular Sheen */}
        <ellipse cx="40" cy="36" rx="28" ry="16" fill="url(#specularGlint)" transform="rotate(-25 40 36)" />
      </svg>
    </div>
  );
};

// ==========================================
// 3D FLOATING GEM / REWARD CRYSTAL
// ==========================================
interface FloatingGem3DProps {
  color?: 'violet' | 'blue' | 'red' | 'gold';
  size?: number;
  className?: string;
  delay?: string;
}

export const FloatingGem3D: React.FC<FloatingGem3DProps> = ({
  color = 'violet',
  size = 32,
  className = '',
  delay = '0s'
}) => {
  const colorMap = {
    violet: {
      glow: 'rgba(124,58,237,0.5)',
      top: '#C4B5FD',
      mid: '#7C3AED',
      bot: '#4C1D95'
    },
    blue: {
      glow: 'rgba(18,100,255,0.5)',
      top: '#93C5FD',
      mid: '#1264FF',
      bot: '#1E3A8A'
    },
    red: {
      glow: 'rgba(255,23,68,0.5)',
      top: '#FDA4AF',
      mid: '#FF1744',
      bot: '#881337'
    },
    gold: {
      glow: 'rgba(255,196,0,0.5)',
      top: '#FEF08A',
      mid: '#F59E0B',
      bot: '#78350F'
    }
  }[color];

  return (
    <div
      className={`inline-block select-none pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        filter: `drop-shadow(0 8px 16px ${colorMap.glow})`,
        animation: 'gemFloat 3.5s ease-in-out infinite alternate',
        animationDelay: delay
      }}
    >
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <polygon points="30,4 52,18 42,54 18,54 8,18" fill={colorMap.bot} />
        <polygon points="30,4 52,18 30,32" fill={colorMap.top} opacity="0.9" />
        <polygon points="30,4 8,18 30,32" fill={colorMap.top} opacity="0.75" />
        <polygon points="8,18 18,54 30,32" fill={colorMap.mid} opacity="0.9" />
        <polygon points="52,18 42,54 30,32" fill={colorMap.mid} opacity="0.8" />
        <polygon points="18,54 42,54 30,32" fill={colorMap.bot} />
        {/* Shimmer line */}
        <line x1="20" y1="12" x2="30" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
    </div>
  );
};

// ==========================================
// 3D FLOATING HOLOGRAPHIC BADGE
// With glass reflections and elevation
// ==========================================
interface FloatingBadge3DProps {
  icon?: React.ReactNode;
  label: string;
  sublabel?: string;
  colorTheme?: 'gold' | 'blue' | 'red' | 'violet';
  className?: string;
}

export const FloatingBadge3D: React.FC<FloatingBadge3DProps> = ({
  icon,
  label,
  sublabel,
  colorTheme = 'gold',
  className = ''
}) => {
  const themeStyles = {
    gold: {
      border: 'border-yellow-300/80 dark:border-yellow-500/70',
      bg: 'bg-gradient-to-r from-amber-500/90 via-yellow-400/95 to-amber-500/90 text-slate-950',
      shadow: 'shadow-[0_10px_25px_rgba(245,158,11,0.35)]',
      subText: 'text-slate-900/80'
    },
    blue: {
      border: 'border-blue-300/80 dark:border-blue-400/70',
      bg: 'bg-gradient-to-r from-blue-600/95 via-blue-500/95 to-indigo-600/95 text-white',
      shadow: 'shadow-[0_10px_25px_rgba(18,100,255,0.35)]',
      subText: 'text-blue-100'
    },
    red: {
      border: 'border-red-300/80 dark:border-red-400/70',
      bg: 'bg-gradient-to-r from-red-600/95 via-rose-500/95 to-red-600/95 text-white',
      shadow: 'shadow-[0_10px_25px_rgba(255,23,68,0.35)]',
      subText: 'text-red-100'
    },
    violet: {
      border: 'border-purple-300/80 dark:border-purple-400/70',
      bg: 'bg-gradient-to-r from-violet-600/95 via-purple-500/95 to-violet-600/95 text-white',
      shadow: 'shadow-[0_10px_25px_rgba(124,58,237,0.35)]',
      subText: 'text-purple-100'
    }
  }[colorTheme];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-md border-2 ${themeStyles.border} ${themeStyles.bg} ${themeStyles.shadow} transition-transform transform hover:scale-105 select-none pointer-events-none ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '600px'
      }}
    >
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="text-left leading-tight">
        <p className="text-xs font-black tracking-tight">{label}</p>
        {sublabel && (
          <p className={`text-[9px] font-bold ${themeStyles.subText}`}>{sublabel}</p>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3D VOLUMETRIC STAGE CONTAINER
// Blends an image seamlessly into the page
// with radial mask, edge feathering, volumetric
// lighting and depth planes
// ==========================================
interface VolumetricStage3DProps {
  children: React.ReactNode;
  glowColor?: 'blue' | 'gold' | 'red' | 'violet';
  className?: string;
}

export const VolumetricStage3D: React.FC<VolumetricStage3DProps> = ({
  children,
  glowColor = 'blue',
  className = ''
}) => {
  const glowGradients = {
    blue: 'from-blue-600/30 via-indigo-600/20 to-transparent',
    gold: 'from-amber-400/35 via-yellow-500/20 to-transparent',
    red: 'from-red-600/30 via-rose-600/20 to-transparent',
    violet: 'from-violet-600/35 via-purple-600/20 to-transparent'
  }[glowColor];

  return (
    <div className={`relative flex items-center justify-center select-none overflow-visible ${className}`}>
      {/* 3D Volumetric Stage Lighting (Multiple concentric blurred halos) */}
      <div className={`absolute -inset-10 bg-radial ${glowGradients} rounded-full blur-3xl pointer-events-none`} />
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Perspective Ground Shadow / Pedestal */}
      <div
        className="absolute -bottom-6 w-3/4 h-8 bg-black/40 rounded-[100%] blur-md pointer-events-none"
        style={{ transform: 'rotateX(75deg)' }}
      />

      {/* Children Content (Artwork with organic edge blending) */}
      <div className="relative z-10 w-full overflow-visible flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
