import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1220",
          50: "#F5F7FB",
          100: "#E6EAF2",
          200: "#C9D1E0",
          300: "#9AA6BD",
          400: "#6B7894",
          500: "#475068",
          600: "#2F3650",
          700: "#1B2238",
          800: "#10172A",
          900: "#0B1220",
        },
        electric: {
          DEFAULT: "#2563EB",
          50: "#EEF3FF",
          100: "#DCE6FF",
          200: "#B7CBFF",
          300: "#86A6FF",
          400: "#5680FF",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E3FB0",
          800: "#1A348B",
          900: "#142A6F",
        },
        mint: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["4rem", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-lg": ["3rem", { lineHeight: "1.08", letterSpacing: "-0.025em", fontWeight: "600" }],
        "display-md": ["2.25rem", { lineHeight: "1.12", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,18,32,0.04), 0 8px 24px -8px rgba(11,18,32,0.08)",
        card: "0 1px 2px rgba(11,18,32,0.05), 0 12px 40px -12px rgba(11,18,32,0.12)",
        glow: "0 0 0 1px rgba(37,99,235,0.15), 0 12px 40px -8px rgba(37,99,235,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "grid-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.35)", opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        shimmer: "shimmer 3s linear infinite",
        "grid-pulse": "grid-pulse 4s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
