/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Deep Obsidian / Void palette for Dark Mode
        void: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          800: '#1E293B',
          900: '#0F172A',
          950: '#070B14',
          card: '#0D1527',
          elevated: '#13203C',
          border: '#1E2E4E',
        },
        // Phosphor / Bio-Tech Mint & Teal accents
        phosphor: {
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          glow: '#00F5A0',
          cyber: '#00D9F5',
        },
        // Airlock Gate Status Colors
        airlock: {
          gate: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          shield: '#6366F1',
        },
      },
      animation: {
        'spin-slow': 'spin 24s linear infinite',
        'pulse-subtle': 'chamberPulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'airlockScan 2.4s ease-in-out infinite',
        'float': 'floating 4s ease-in-out infinite',
      },
      keyframes: {
        chamberPulse: {
          '0%, 100%': { transform: 'rotate(45deg) scale(1)', opacity: '1' },
          '50%': { transform: 'rotate(45deg) scale(1.08)', opacity: '0.85' },
        },
        airlockScan: {
          '0%': { top: '0%', opacity: '0.8' },
          '50%': { top: '96%', opacity: '1' },
          '100%': { top: '0%', opacity: '0.8' },
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      boxShadow: {
        'glow-mint': '0 0 25px -5px rgba(0, 245, 160, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(0, 217, 245, 0.3)',
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
      },
    },
  },
  plugins: [],
}
