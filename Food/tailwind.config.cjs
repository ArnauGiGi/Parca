wind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow': {
          'text-shadow': '2px 2px 4px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-sm': {
          'text-shadow': '1px 1px 2px rgba(0, 0, 0, 0.4)',
        },
        '.text-shadow-lg': {
          'text-shadow': '4px 4px 8px rgba(0, 0, 0, 0.6)',
        },
        '.text-shadow-xl': {
          'text-shadow': '4px 4px 16px rgba(0, 0, 0, 0.7)',
        },
        '.text-shadow-none': {
          'text-shadow': 'none',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}