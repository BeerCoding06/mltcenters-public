/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        runner: {
          sky: "#87CEEB",
          ground: "#5D4037",
          accent: "#FF6B35",
        },
      },
    },
  },
  plugins: [],
};
