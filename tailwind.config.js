/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F2F5FA',
          100: '#E2E9F3',
          200: '#C4D2E6',
          300: '#99B0D1',
          400: '#6787B5',
          500: '#456894',
          600: '#335078',
          700: '#294060',
          800: '#1B2E49',
          900: '#10233D',
          950: '#081528',
        },
        teal: {
          50: '#ECFCF7',
          100: '#D0F7EB',
          200: '#A4EEDB',
          300: '#6DDFC5',
          400: '#35C8AA',
          500: '#12AC90',
          600: '#078A75',
          700: '#096F60',
          800: '#0B584E',
          900: '#0C4941',
          950: '#032B27',
        },
        sand: {
          50: '#FAFAF7',
          100: '#F4F5F0',
          200: '#E9EBE2',
        },
        coral: {
          500: '#E4572E',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 35, 61, 0.04), 0 8px 24px -12px rgba(16, 35, 61, 0.14)',
        lift: '0 2px 4px rgba(16, 35, 61, 0.05), 0 18px 40px -18px rgba(16, 35, 61, 0.22)',
        insetline: 'inset 0 0 0 1px rgba(16, 35, 61, 0.06)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.86)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
