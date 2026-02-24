/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          50:  "#eefbf3",
          100: "#d6f5e3",
          200: "#b0eacc",
          300: "#7dd8ad",
          400: "#47bd87",
          500: "#25a06c",
          600: "#178157",
          700: "#136748",
          800: "#12523a",
          900: "#104431",
          950: "#07271d",
        },
        surface: {
          DEFAULT: "#0d1117",
          1: "#161b22",
          2: "#21262d",
          3: "#30363d",
          4: "#444c56",
        }
      },
    },
  },
  plugins: [],
}