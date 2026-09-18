/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F17',
          surface: '#121826',
          card: '#182234',
          border: '#223049',
          muted: '#8E9EB5',
          text: '#F0F4FC'
        },
        brand: {
          50: '#eef8ff',
          100: '#d8efff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1'
        },
        status: {
          queued: '#94A3B8',
          building: '#F59E0B',
          starting: '#3B82F6',
          running: '#10B981',
          failed: '#EF4444',
          stopping: '#F97316',
          destroyed: '#64748B'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
