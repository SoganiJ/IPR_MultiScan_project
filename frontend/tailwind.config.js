/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        surface: {
          DEFAULT: '#0f172a',
          card: '#161f30',
          hover: '#1e293b',
          border: '#2a374a',
        },
        brand: {
          cyan: '#06b6d4',
          teal: '#14b8a6',
          sky: '#38bdf8',
          blue: '#2563eb',
        },
        status: {
          reviewReady: '#10b981',
          reviewRequired: '#f59e0b',
          rejected: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
