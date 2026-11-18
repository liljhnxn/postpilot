import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0B1020",
          secondary: "#121A2B",
          card: "#172137",
          hover: "#1D2A45",
          muted: "#0F162A",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          secondary: "#A78BFA",
          dark: "#7C3AED",
          glow: "rgba(139, 92, 246, 0.15)",
        },
        foreground: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          subtle: "#64748B",
        },
        border: {
          DEFAULT: "rgba(148, 163, 184, 0.12)",
          bright: "rgba(148, 163, 184, 0.22)",
          accent: "rgba(139, 92, 246, 0.35)",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.45)",
        "card-hover": "0 8px 30px -4px rgba(0, 0, 0, 0.65), 0 0 15px 0 rgba(139, 92, 246, 0.15)",
        glow: "0 0 20px -3px rgba(139, 92, 246, 0.35)",
        glass: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;

