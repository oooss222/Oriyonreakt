/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: { brand:'#0B3B66', accent:'#2F80ED' },
      borderRadius: { card:'16px' },
      boxShadow: { soft:'0 1px 0 rgba(0,0,0,.04)' },
    },
  },
  plugins: [],
}
