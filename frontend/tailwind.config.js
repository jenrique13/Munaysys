/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: 'rgb(var(--color-primary-rgb) / 0.1)',
          100: 'rgb(var(--color-primary-rgb) / 0.15)',
          200: 'rgb(var(--color-primary-rgb) / 0.25)',
          300: 'rgb(var(--color-primary-rgb) / 0.4)',
          400: 'rgb(var(--color-primary-rgb) / 0.5)',
          500: 'rgb(var(--color-primary-rgb) / 0.8)',
          600: 'var(--color-primary)',
          700: 'rgb(var(--color-primary-rgb) / 0.9)',
          800: 'rgb(var(--color-primary-rgb) / 0.95)',
          900: 'rgb(var(--color-primary-rgb) / 1)',
          950: 'rgb(var(--color-primary-rgb) / 1)',
        }
      }
    },
  },
  plugins: [],
}
