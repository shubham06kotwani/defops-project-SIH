/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Olive Greens
        olive: {
          950: '#09100a',
          900: '#121f15',
          800: '#1c2f21',
          700: '#27412e',
          600: '#35563e',
          500: '#467252',
          400: '#5c926c',
        },
        // Matte Blacks & Charcoal Grays
        matte: {
          950: '#07090b',
          900: '#0d1014',
          850: '#12161c',
          800: '#171c24',
          750: '#1e242f',
          700: '#262e3b',
          600: '#333e4f',
        },
        // Tactical Night Blues
        navy: {
          950: '#050a14',
          900: '#0a1222',
          800: '#101c34',
          700: '#18294a',
          600: '#243a66',
        },
        // High-Visibility Safety Orange
        safety: {
          300: '#ffaa66',
          400: '#ff8833',
          500: '#ff6600',
          600: '#e65100',
          700: '#bf3f00',
        },
        // Desert Tan Accents
        tan: {
          300: '#f0deb8',
          400: '#e3ca97',
          500: '#d4b483',
          600: '#bca06f',
          700: '#9b8254',
        },
        // HUD Radar Green
        hud: {
          400: '#33ff77',
          500: '#00e655',
          600: '#00b342',
        }
      },
      boxShadow: {
        'hud-glow': '0 0 15px rgba(0, 230, 85, 0.25)',
        'orange-glow': '0 0 15px rgba(255, 102, 0, 0.3)',
        'tactical': '0 4px 20px rgba(0, 0, 0, 0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        tactical: ['Rajdhani', 'sans-serif'],
        stencil: ['"Chakra Petch"', 'Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
