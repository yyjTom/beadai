import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          DEFAULT: '#FFFDF7',
          soft: '#F6F1E7',
        },
        ink: {
          DEFAULT: '#2B2A29',
          muted: '#6B6660',
        },
        bead: {
          coral: '#FF6B6B',
          amber: '#FFB84C',
          sky: '#3BC9DB',
          violet: '#7C5CFF',
        },
        state: {
          success: '#34C759',
          danger: '#FF4D4F',
          warning: '#FFB020',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.75rem',
      },
      boxShadow: {
        soft: '0 10px 30px -18px rgba(43, 42, 41, 0.35)',
        lift: '0 22px 45px -24px rgba(43, 42, 41, 0.45)',
        bead: 'inset 0 -6px 10px -6px rgba(0,0,0,0.35), inset 0 6px 10px -6px rgba(255,255,255,0.7)',
      },
      backgroundImage: {
        'bead-grid':
          'radial-gradient(circle at 1px 1px, rgba(43,42,41,0.08) 1px, transparent 0)',
        'brand-glow':
          'linear-gradient(120deg, rgba(255,107,107,0.18), rgba(255,184,76,0.18), rgba(59,201,219,0.18), rgba(124,92,255,0.18))',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pop-in': 'pop-in 0.28s ease-out both',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#2B2A29',
          },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
