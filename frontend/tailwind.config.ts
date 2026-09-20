import type { Config } from 'tailwindcss';

const config: Config = {
  // dark mode piloté par la classe `.dark` posée sur <html> (ThemeProvider)
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        // polices injectées via next/font (layout) ; fallbacks locaux
        display: ['var(--font-display)', 'Georgia', 'ui-serif', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // --- Neutres sémantiques (variables CSS, clair + sombre) ---
        ink: {
          strong: 'var(--ink-strong)',
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        paper: {
          DEFAULT: 'var(--paper)',
          muted: 'var(--paper-muted)',
          sunken: 'var(--paper-sunken)',
        },
        line: {
          DEFAULT: 'var(--line)',
          soft: 'var(--line-soft)',
          strong: 'var(--line-strong)',
        },
        // --- Primaire « feuille » (vert profond émeraude, hommage baobab) ---
        brand: {
          50: '#eefbf5',
          100: '#d7f4e6',
          200: '#abe7cd',
          300: '#58d2a6',
          400: '#21b685',
          500: '#0ea57b',
          600: '#0a8a68',
          700: '#086e55',
          800: '#0a5845',
          900: '#0b4839',
          950: '#06251d',
        },
        // --- Accent « safran » (énergie, CTA, prix barrés) ---
        accent: {
          100: '#fff4db',
          200: '#ffe6ad',
          300: '#ffd47a',
          400: '#ffbd3d',
          500: '#f9a605',
          600: '#db8305',
          700: '#b46907',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,31,26,0.04), 0 4px 16px -8px rgba(15,31,26,0.08)',
        'card-hover': '0 2px 4px rgba(15,31,26,0.05), 0 14px 40px -14px rgba(15,31,26,0.18)',
        lift: '0 12px 32px -12px rgba(15,31,26,0.25)',
        'focus-ring': '0 0 0 4px rgba(14,165,123,0.25)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;