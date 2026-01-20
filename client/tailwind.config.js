/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        gaming: {
          dark: '#0f0f23',
          darker: '#0a0a1a',
          purple: '#6366f1',
          pink: '#ec4899',
          cyan: '#06b6d4',
          green: '#10b981'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        glow: {
          '0%': {
            boxShadow: '0 0 5px rgb(99, 102, 241), 0 0 10px rgb(99, 102, 241)'
          },
          '100%': {
            boxShadow: '0 0 20px rgb(99, 102, 241), 0 0 30px rgb(99, 102, 241)'
          }
        }
      }
    }
  },
  plugins: []
}
