/** @type {import('tailwindcss').Config} */

/*
 * Oriyon design tokens.
 *
 * The neutral, danger, success, warning and info ramps intentionally overwrite
 * Tailwind's stock `slate`/`gray`/`red`/`emerald`/... palettes. Large parts of
 * the app (admin, moderation, analytics) were written against the stock
 * palette, so remapping the palette itself pulls those screens onto the brand
 * without rewriting every call site — and it stops new drift from looking
 * different than the rest of the product.
 */

// Cool neutral. `400` is the lightest step that still clears 4.5:1 on white, so
// it is the floor for muted body copy; `300` is for borders and decoration.
const neutral = {
  DEFAULT: "#12161B",
  50: "#F7F8FA",
  100: "#EEF1F4",
  200: "#E1E5EA",
  300: "#98A0AB",
  400: "#6E7681",
  500: "#545C67",
  600: "#3C444E",
  700: "#2A313A",
  800: "#1B2026",
  900: "#12161B",
  950: "#0A0D10",
};

const sun = {
  DEFAULT: "#FF6A00",
  50: "#FFF4EC",
  100: "#FFE3CD",
  200: "#FFC59B",
  300: "#FFA163",
  400: "#FF8033",
  500: "#FF6A00",
  600: "#E45700",
  700: "#B94500",
  800: "#8F3600",
  900: "#742D02",
};

const lagoon = {
  DEFAULT: "#0E7C7B",
  50: "#E9F6F5",
  100: "#C9E9E7",
  200: "#93D3CF",
  300: "#55B8B3",
  400: "#219A95",
  500: "#0E7C7B",
  600: "#0B6362",
  700: "#0A4F4E",
  800: "#073B3A",
  900: "#052A2A",
};

const mist = {
  DEFAULT: "#F4F6F8",
  50: "#FAFBFC",
  100: "#F4F6F8",
  200: "#E9EDF1",
  300: "#DDE3E9",
};

const danger = {
  DEFAULT: "#D92D20",
  50: "#FEF3F2",
  100: "#FEE4E2",
  200: "#FECDCA",
  300: "#FDA29B",
  400: "#F27168",
  500: "#E5453A",
  600: "#D92D20",
  700: "#B42318",
  800: "#912018",
  900: "#7A271A",
  950: "#55160C",
};

const success = {
  DEFAULT: "#0E9F6E",
  50: "#ECFDF5",
  100: "#D1FAE5",
  200: "#A7F3D0",
  300: "#6EE7B7",
  400: "#31C48D",
  500: "#0E9F6E",
  600: "#057A55",
  700: "#046C4E",
  800: "#03543F",
  900: "#014737",
  950: "#012A21",
};

const warning = {
  DEFAULT: "#B54708",
  50: "#FFFAEB",
  100: "#FEF0C7",
  200: "#FEDF89",
  300: "#FEC84B",
  400: "#FDB022",
  500: "#F79009",
  600: "#DC6803",
  700: "#B54708",
  800: "#93370D",
  900: "#7A2E0E",
  950: "#4E1D09",
};

const info = {
  DEFAULT: "#175CD3",
  50: "#EFF6FF",
  100: "#DBEAFE",
  200: "#BFDBFE",
  300: "#93C5FD",
  400: "#60A5FA",
  500: "#2E90FA",
  600: "#175CD3",
  700: "#1849A9",
  800: "#194185",
  900: "#102A56",
  950: "#0B1B38",
};

module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "420px",
        "3xl": "1600px",
      },
      colors: {
        ink: neutral,
        sun,
        lagoon,
        mist,
        danger,
        success,
        warning,
        info,

        // Brand aliases kept for existing call sites.
        brand: { ...neutral, DEFAULT: neutral[900], 600: neutral[900], 700: neutral[950] },
        accent: sun,

        // Stock palette remapped onto the design system.
        slate: neutral,
        gray: neutral,
        zinc: neutral,
        neutral,
        stone: neutral,
        red: danger,
        rose: danger,
        emerald: success,
        green: success,
        teal: lagoon,
        cyan: lagoon,
        amber: warning,
        yellow: warning,
        orange: sun,
        blue: info,
        sky: info,
        indigo: info,
        violet: info,
        purple: info,
      },
      fontFamily: {
        display: ["Outfit", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Manrope", "Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // 11px is the floor and is reserved for metadata; body copy starts at 14px.
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1.0625rem" }],
        sm: ["0.875rem", { lineHeight: "1.3125rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.0625rem", { lineHeight: "1.625rem" }],
        xl: ["1.1875rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.4375rem", { lineHeight: "1.875rem" }],
        "3xl": ["1.75rem", { lineHeight: "2.125rem" }],
        "4xl": ["2.125rem", { lineHeight: "2.5rem" }],
        "5xl": ["2.75rem", { lineHeight: "3rem" }],
        "6xl": ["3.375rem", { lineHeight: "3.625rem" }],
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.5rem",
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
        card: "1.125rem",
      },
      borderColor: {
        DEFAULT: neutral[200],
      },
      ringColor: {
        DEFAULT: sun[500],
      },
      boxShadow: {
        xs: "0 1px 2px rgb(18 22 27 / 0.05)",
        sm: "0 1px 2px rgb(18 22 27 / 0.05), 0 1px 3px rgb(18 22 27 / 0.05)",
        DEFAULT: "0 1px 2px rgb(18 22 27 / 0.05), 0 1px 3px rgb(18 22 27 / 0.05)",
        md: "0 2px 4px -2px rgb(18 22 27 / 0.05), 0 6px 16px -6px rgb(18 22 27 / 0.10)",
        lg: "0 4px 8px -4px rgb(18 22 27 / 0.06), 0 14px 32px -12px rgb(18 22 27 / 0.14)",
        xl: "0 8px 16px -8px rgb(18 22 27 / 0.08), 0 28px 56px -20px rgb(18 22 27 / 0.18)",
        soft: "0 1px 2px rgb(18 22 27 / 0.05), 0 1px 3px rgb(18 22 27 / 0.05)",
        lift: "0 2px 4px -2px rgb(18 22 27 / 0.05), 0 6px 16px -6px rgb(18 22 27 / 0.10)",
        focus: "0 0 0 3px rgb(255 106 0 / 0.28)",
      },
      maxWidth: {
        content: "80rem",
      },
      spacing: {
        header: "4rem",
        "safe-nav": "calc(4.25rem + env(safe-area-inset-bottom, 0px))",
      },
      transitionDuration: {
        DEFAULT: "160ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms ease-out both",
        "fade-in-up": "fade-in-up 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 160ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up": "slide-up 240ms cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
