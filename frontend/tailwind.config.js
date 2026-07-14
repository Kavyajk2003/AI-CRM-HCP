/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
module.exports = {
  darkMode: 'class', // Add this line
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
}