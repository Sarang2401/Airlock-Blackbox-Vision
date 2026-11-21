import React from 'react';

interface AirlockLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const AirlockLogo: React.FC<AirlockLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const dim = {
    sm: { box: 28, svg: 24, name: 'text-sm', sub: 'text-[10px]' },
    md: { box: 36, svg: 30, name: 'text-base', sub: 'text-[11px]' },
    lg: { box: 48, svg: 40, name: 'text-xl', sub: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-900 border border-zinc-700/80 dark:border-zinc-700 shadow-sm flex-shrink-0"
        style={{ width: dim.box, height: dim.box }}
      >
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ring */}
          <circle cx="24" cy="24" r="19" stroke="#262626" strokeWidth="1.5" />
          {/* Hexagonal outline */}
          <polygon
            points="24,9 36,16.5 36,31.5 24,39 12,31.5 12,16.5"
            stroke="#10B981"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
          />
          {/* Core diamond */}
          <rect
            x="19"
            y="19"
            width="10"
            height="10"
            rx="2"
            transform="rotate(45 24 24)"
            fill="#10B981"
            fillOpacity="0.9"
          />
          {/* Center dot */}
          <circle cx="24" cy="24" r="2" fill="#FAFAFA" />
        </svg>
        {/* Status indicator — only the core dot, no animate-ping */}
        <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight text-zinc-900 dark:text-zinc-50 ${dim.name}`}>
            Airlock
          </span>
          <span className={`text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 ${dim.sub}`}>
            + Black Box
          </span>
        </div>
      )}
    </div>
  );
};
