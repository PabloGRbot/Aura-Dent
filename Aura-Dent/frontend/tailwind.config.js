/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-ink':     '#130e30',
        'hi-yellow':    '#ffe228',
        'moss-green':   '#59e25d',
        'fuchsia-blob': '#e261e5',
        'slate-text':   '#5f5c6e',
        'canvas':       '#f9fbf2',
        'soft-meadow':  '#eff2e5',
        'charcoal':     '#222222',
        'dental-teal':  '#0a7e6b',
      },
      fontFamily: {
        hedvig: ['"Hedvig Letters Serif"', '"DM Serif Display"', 'Georgia', 'serif'],
        inter:  ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '1440px',
        card: '24px',
        'card-sm': '16px',
      },
      fontSize: {
        'caption':    ['10px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'body-sm':    ['14px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'body':       ['16px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'subheading': ['18px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'heading-sm': ['22px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'heading':    ['32px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'heading-lg': ['48px', { lineHeight: '1.1',  letterSpacing: '-0.01em' }],
        'display':    ['64px', { lineHeight: '1.0',  letterSpacing: '-0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        'page': '1200px',
      },
      animation: {
        'aparecer-arriba': 'aparecerArriba 0.6s ease-out both',
        'flotar':          'flotar 6s ease-in-out infinite',
        'flotar-lento':    'flotar 9s ease-in-out infinite',
        'fade-in':         'fadeIn 0.4s ease-out both',
        'slide-up':        'slideUp 0.5s ease-out both',
        'pulse-suave':     'pulseSuave 2s ease-in-out infinite',
        'escribiendo':     'escribiendo 1.2s ease-in-out infinite',
      },
      keyframes: {
        aparecerArriba: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        flotar: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-14px) rotate(2deg)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSuave: {
          '0%, 100%': { opacity: '0.7' },
          '50%':      { opacity: '1' },
        },
        escribiendo: {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%':           { opacity: '1',   transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        'card':    '0 2px 16px rgba(19,14,48,0.08)',
        'widget':  '0 8px 40px rgba(19,14,48,0.18)',
        'btn':     '0 2px 8px rgba(19,14,48,0.12)',
      },
    },
  },
  plugins: [],
};
