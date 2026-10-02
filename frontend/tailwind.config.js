/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shady: {
          50: '#f2f7f4',
          100: '#e3eee6',
          200: '#c7ddce',
          300: '#a3c5ae',
          400: '#75a684',
          500: '#528b63',
          600: '#40916c',
          700: '#2d6a4f',
          800: '#1b4332',
          900: '#081c15',
        },
        surface: {
          card: '#ffffff',
          subtle: '#f8faf9',
          border: '#e1ece4'
        }
      },
      boxShadow: {
        'shady-sm': '0 2px 8px rgba(27, 67, 50, 0.05)',
        'shady-md': '0 4px 16px rgba(27, 67, 50, 0.08)',
        'shady-lg': '0 10px 30px rgba(27, 67, 50, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        tactical: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
