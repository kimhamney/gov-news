/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/**/*.mdx",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#24D2A3", dark: "#12B58C" },
        surface: "#EEF3F6",
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
      boxShadow: { card: "0 6px 24px rgba(17, 24, 39, 0.06)" },
    },
  },
  plugins: [],
};
