/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void:    '#0a0a0c',
        surface: '#111115',
        panel:   '#18181f',
        border:  '#2a2a35',
        muted:   '#3d3d4d',
        dim:     '#6b6b80',
        soft:    '#a0a0b8',
        bright:  '#e8e8f0',
        amber: {
          DEFAULT: '#f59e0b',
          dim:     '#92610a',
          glow:    '#fbbf24',
        },
        emerald: { DEFAULT: '#10b981', dim: '#065f46' },
        rose:    { DEFAULT: '#f43f5e', dim: '#881337' },
        sky:     { DEFAULT: '#38bdf8', dim: '#0c4a6e' },
        violet:  { DEFAULT: '#8b5cf6', dim: '#3b0764' },
      },
      boxShadow: {
        'amber-glow': '0 0 20px rgba(245, 158, 11, 0.15)',
        'panel':      '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(42,42,53,0.8)',
        'inset-top':  'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease forwards',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'shimmer':   'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
};