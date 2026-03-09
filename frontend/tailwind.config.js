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
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in": "slideIn 0.4s ease forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "scan-line": "scanLine 2s ease-in-out infinite",
      },
      keyframes: {
        scanLine: {
          "0%":   { top: "8px"   },
          "50%":  { top: "calc(100% - 8px)" },
          "100%": { top: "8px"   },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideIn: {
          "0%": { opacity: 0, transform: "translateX(-20px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};