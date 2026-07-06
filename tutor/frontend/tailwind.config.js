/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        tutor: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
      },
      animation: {
        breathe: "breathe 4s ease-in-out infinite",
        blink: "blink 0.15s ease-in-out",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1) translateY(0)" },
          "50%": { transform: "scale(1.008) translateY(-2px)" },
        },
        blink: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(0.05)" },
        },
      },
    },
  },
  plugins: [],
};
