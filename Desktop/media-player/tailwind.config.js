/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0f',
          surface: '#111118',
          elevated: '#18181f',
          hover: '#1f1f28',
          active: '#25252f',
        },
        primary: {
          DEFAULT: '#7c3aed',
          light: '#8b5cf6',
          glow: 'rgba(124,58,237,0.4)',
        },
        accent: {
          pink: '#ec4899',
          cyan: '#06b6d4',
          amber: '#f59e0b',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.1)',
          strong: 'rgba(255,255,255,0.18)',
        },
        text: {
          primary: '#f0f0f5',
          secondary: '#a0a0b0',
          muted: '#60607a',
        },
        vk: {
          DEFAULT: '#2787F5',
          dark: '#1a6ad4',
        },
        yandex: {
          DEFAULT: '#fc3f1d',
          dark: '#e03516',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(124,58,237,0.6)' },
        },
        'pulse-glow-play': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0)' },
          '50%': { boxShadow: '0 0 0 8px rgba(124,58,237,0.2)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'spin-vinyl': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        equalizer: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '20px' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-glow-play': 'pulse-glow-play 1.8s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'spin-vinyl': 'spin-vinyl 8s linear infinite',
        'eq-1': 'equalizer 0.6s ease-in-out infinite',
        'eq-2': 'equalizer 0.8s ease-in-out infinite 0.1s',
        'eq-3': 'equalizer 0.7s ease-in-out infinite 0.2s',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glow': 'linear-gradient(135deg, #7c3aed22 0%, #ec489922 100%)',
      },
    },
  },
  plugins: [],
}
