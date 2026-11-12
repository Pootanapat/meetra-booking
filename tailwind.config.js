/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./js/**/*.js",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: { preflight: false },
  theme: {
    extend: {},
  },
  plugins: [],
}
