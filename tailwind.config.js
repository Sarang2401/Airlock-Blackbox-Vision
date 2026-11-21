/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Neutral dark surfaces
        surface: {
          base: '#0A0A0A',
          card: '#111111',
          elevated: '#1A1A1A',
          border: '#262626',
          'border-subtle': '#1A1A1A',
        },
        // Brand
        brand: {
          DEFAULT: '#10B981',
          hover: '#059669',
          muted: '#10B98120',
          'text-dark': '#34D399',
          'text-light': '#059669',
        },
        // Zinc scale for neutrals (matches Vercel/Linear aesthetic)
        ink: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          muted: '#52525B',
          subtle: '#3F3F46',
        },
      },
      animation: {
        'spin-slow': 'spin 24s linear infinite',
        'pulse-gentle': 'pulseGentle 3s ease-in-out infinite',
        'scan': 'airlockScan 2.4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
      },
      keyframes: {
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        airlockScan: {
          '0%': { top: '0%', opacity: '0.9' },
          '50%': { top: '96%', opacity: '1' },
          '100%': { top: '0%', opacity: '0.9' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-dark': '0 1px 3px 0 rgb(0 0 0 / 0.5)',
        'brand': '0 0 0 3px rgb(16 185 129 / 0.15)',
      },
    },
  },
  plugins: [],
}
