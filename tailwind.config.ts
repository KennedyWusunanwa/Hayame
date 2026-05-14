import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        brandHover: "var(--brand-hover)",
        brandMuted: "var(--brand)",
        border: "#e5e7eb",
        input: "#e5e7eb",
        ring: "#0ea5e9",
        background: "#ffffff",
        foreground: "#0b1220",
        primary: {
          DEFAULT: "#0e86d4",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#0e86d4",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f4f4f5",
          foreground: "#6b7280",
        },
        accent: {
          DEFAULT: "#e0f2fe",
          foreground: "#0f172a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#fef2f2",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0b1220",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
          ...fontFamily.sans,
        ],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
      },
      boxShadow: {
        soft: "0 12px 30px rgba(0,0,0,0.06)",
        card: "0 16px 40px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
