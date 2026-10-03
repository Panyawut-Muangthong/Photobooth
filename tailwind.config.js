/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vintage: {
          cream: '#FAF7F0',
          sand: '#EFE9D9',
          blush: '#F8E8EE',
          rose: '#FDCEDF',
          sage: '#D2E3C8',
          sky: '#DDEB9D',
          lavender: '#E5D4ED',
          peach: '#FFE5CA',
          charcoal: '#1E1E24',
          slate: '#2E3840',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
        display: ['ui-rounded', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'polaroid': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        'strip': '0 20px 40px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
