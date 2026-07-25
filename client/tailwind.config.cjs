/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C1B1A",
          50: "#F4F3F1",
          100: "#E8E6E3",
          200: "#D1CEC9",
          300: "#A8A49C",
          400: "#7A756C",
          500: "#4A4640",
          600: "#2F2C28",
          700: "#252320",
          800: "#1C1B1A",
          900: "#121110",
        },
        sun: {
          DEFAULT: "#FF6A00",
          50: "#FFF4EB",
          100: "#FFE4CC",
          200: "#FFC799",
          300: "#FFA05C",
          400: "#FF7E26",
          500: "#FF6A00",
          600: "#E85A00",
          700: "#C44700",
          800: "#9A3600",
        },
        lagoon: {
          DEFAULT: "#0E7C7B",
          50: "#E8F6F6",
          100: "#C5E8E7",
          200: "#8FD0CF",
          500: "#0E7C7B",
          600: "#0B6362",
          700: "#084C4B",
        },
        mist: {
          DEFAULT: "#F3F5F7",
          50: "#F8F9FB",
          100: "#F3F5F7",
          200: "#E6EAEF",
        },
        brand: {
          DEFAULT: "#1C1B1A",
          50: "#F4F3F1",
          600: "#1C1B1A",
          700: "#121110",
          800: "#0A0909",
        },
        accent: {
          DEFAULT: "#FF6A00",
          50: "#FFF4EB",
          100: "#FFE4CC",
          500: "#FF6A00",
          600: "#E85A00",
          700: "#C44700",
        },
      },
      fontFamily: {
        display: [
          "Outfit",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Manrope",
          "Outfit",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "1rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(28 27 26 / 0.05)",
        lift: "0 8px 24px rgb(28 27 26 / 0.08)",
      },
      backgroundImage: {
        horizon:
          "radial-gradient(ellipse 90% 55% at 50% -15%, rgb(255 106 0 / 0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgb(14 124 123 / 0.08), transparent 50%), linear-gradient(180deg, #F8F9FB 0%, #F3F5F7 45%, #EEF1F4 100%)",
      },
    },
  },
  plugins: [],
};
