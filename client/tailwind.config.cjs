/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0B3B66",
          50: "#EEF6FC",
          100: "#D6EAF8",
          600: "#0B3B66",
          700: "#082D4F",
          800: "#061F38",
        },
        accent: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "16px",
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px rgb(15 23 42 / 0.04)",
        card: "0 1px 2px rgb(15 23 42 / 0.05), 0 8px 24px rgb(15 23 42 / 0.06)",
        "card-hover":
          "0 4px 8px rgb(15 23 42 / 0.06), 0 16px 40px rgb(15 23 42 / 0.1)",
        glow: "0 0 0 1px rgb(37 99 235 / 0.08), 0 8px 32px rgb(37 99 235 / 0.12)",
      },
      animation: {
        "fade-in-up": "fade-in-up 0.45s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      backgroundImage: {
        "page-gradient":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(219 234 254 / 0.5), transparent), linear-gradient(to bottom, rgb(248 250 252), rgb(241 245 249))",
      },
    },
  },
  plugins: [],
};
