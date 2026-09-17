/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#1a56db',
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#1e3a6e',
          900: '#0f2554',
        },
        gold: {
          400: '#f59e0b',
          500: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Noto Sans Khmer', 'sans-serif'],
        battambang: ['Battambang', 'Noto Sans Khmer', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
