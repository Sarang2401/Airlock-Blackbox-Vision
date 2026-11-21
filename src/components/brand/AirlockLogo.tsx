import React from 'react';

interface AirlockLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const AirlockLogo: React.FC<AirlockLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const dimensions = {
    sm: { box: 32, icon: 28, textMain: 'text-base', textSub: 'text-[10px]' },
    md: { box: 42, icon: 38, textMain: 'text-lg', textSub: 'text-xs' },
    lg: { box: 56, icon: 50, textMain: 'text-2xl', textSub: 'text-sm' },
    xl: { box: 72, icon: 64, textMain: 'text-3xl', textSub: 'text-base' },
  }[size];

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Handcrafted Animated Brand Mark */}
      <div
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 border border-slate-800/80 dark:border-cyan-900/40 shadow-lg shadow-cyan-950/20 group cursor-pointer"
        style={{ width: dimensions.box, height: dimensions.box }}
      >
        {/* Ambient Glow Aura */}
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 dark:bg-cyan-400/15 blur-md group-hover:bg-cyan-500/25 transition-all duration-500" />

        {/* Vector SVG Brand Mark */}
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Outer Orbital Containment Ring (Airlock Chamber) */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="url(#ringGrad)"
            strokeWidth="2"
            strokeDasharray="9 5"
            className="animate-spin-slow origin-center opacity-80"
          />

          {/* Inner Hexagonal Seal Plate */}
          <polygon
            points="24,8 37,16 37,32 24,40 11,32 11,16"
            stroke="url(#hexGrad)"
            strokeWidth="1.5"
            fill="url(#sealFill)"
            className="opacity-90"
          />

          {/* Central Black Box Core (Quantum Telemetry Diamond) */}
          <rect
            x="18"
            y="18"
            width="12"
            height="12"
            rx="2.5"
            transform="rotate(45 24 24)"
            fill="url(#coreGrad)"
            stroke="#00F5A0"
            strokeWidth="1.5"
            className="animate-pulse-subtle"
          />

          {/* Optical Telemetry Aperture / Sensor Eye */}
          <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />

          {/* Gradients */}
          <defs>
            <linearGradient id="ringGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00F5A0" />
              <stop offset="0.5" stopColor="#00D9F5" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="hexGrad" x1="11" y1="8" x2="37" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="sealFill" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0F172A" stopOpacity="0.8" />
              <stop offset="1" stopColor="#020617" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="coreGrad" x1="18" y1="18" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284C7" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>

        {/* Live Status Telemetry Dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950" />
        </span>
      </div>

      {/* Typography Lockup */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5 leading-none">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${dimensions.textMain}`}>
              AIRLOCK
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-light text-xs font-mono">+</span>
            <span className={`font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-teal-300 bg-clip-text text-transparent ${dimensions.textMain}`}>
              BLACK BOX
            </span>
          </div>
          <span className={`text-slate-600 dark:text-slate-300 font-medium tracking-wide mt-0.5 ${dimensions.textSub}`}>
            Privacy Gateway & Hybrid Observability
          </span>
        </div>
      )}
    </div>
  );
};
