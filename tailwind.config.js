/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: "#0D1B1E",
        emerald: {
          DEFAULT: "#10B981",
        },
        amber: {
          DEFAULT: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["Space Grotesk", "monospace"],
      },
    },
  },
  plugins: [],
};
