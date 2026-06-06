/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        fence: {
          bg: "rgba(20, 20, 30, 0.85)",
          border: "rgba(255, 255, 255, 0.1)",
          hover: "rgba(255, 255, 255, 0.05)",
        },
      },
      backdropBlur: {
        fence: "20px",
      },
    },
  },
  plugins: [],
};
