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
        primary: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#1E2A3A",
          900: "#102a43",
        },
        accent: {
          50: "#e6f7f5",
          100: "#c1ebe4",
          200: "#95dccd",
          300: "#67cbb8",
          400: "#45bca5",
          500: "#2A9D8F",
          600: "#238a7d",
          700: "#1b7167",
          800: "#155851",
          900: "#0e3f3b",
        },
        warning: {
          50: "#fef9e7",
          100: "#fbeab5",
          200: "#f7d97a",
          300: "#f2c645",
          400: "#EDB928",
          500: "#E9C46A",
          600: "#d9a93c",
          700: "#b78529",
          800: "#94631c",
          900: "#714611",
        },
        danger: {
          50: "#fdecec",
          100: "#fbd1d1",
          200: "#f5a6a6",
          300: "#ed7676",
          400: "#e34d4d",
          500: "#d63333",
          600: "#b82626",
          700: "#941d1d",
          800: "#6f1515",
          900: "#4d0e0e",
        },
        ink: {
          50: "#f7f8f9",
          100: "#eceef1",
          200: "#d9dde2",
          300: "#b7bfc8",
          400: "#8b96a4",
          500: "#636f7f",
          600: "#4a5461",
          700: "#383f4a",
          800: "#252a32",
          900: "#14171c",
        },
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Source Han Sans CN"',
          '"Microsoft YaHei"',
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ["'Roboto Mono'", "'SFMono-Regular'", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(16, 42, 67, 0.08), 0 1px 2px 0 rgba(16, 42, 67, 0.04)",
        "card-hover":
          "0 4px 12px 0 rgba(16, 42, 67, 0.1), 0 2px 4px 0 rgba(16, 42, 67, 0.06)",
        "soft-lg": "0 10px 25px -5px rgba(30, 42, 58, 0.1)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 0.8s ease-out",
        "fade-in-up": "fade-in-up 0.25s ease-out",
        "slide-in-right": "slide-in-right 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
