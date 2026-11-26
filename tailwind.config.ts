import type { Config } from "tailwindcss";

const withOpacity = (cssVar: string) => `rgb(var(${cssVar}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet Resmi HMIF Telkom University Purwokerto (Konstanta Brand)
        hmif: {
          dark: "#1E1E1E",
          gold: "#EBBD1C",
          yellow: "#F3EC51",
          cream: "#F8FAE0",
          red: "#B71B25",
          blue: "#29388B",
          "blue-hover": "#212E72",
          "gray-dark": "#5E5E5E",
          "gray-light": "#8B8A8B",
          white: "#FFFFFF",
        },
        // Semantic Design Tokens (Dual-Theme: Light default + Dark class)
        "surface-container-lowest": withOpacity("--surface-container-lowest"),
        "surface-container-low": withOpacity("--surface-container-low"),
        "surface-container": withOpacity("--surface-container"),
        "surface-container-high": withOpacity("--surface-container-high"),
        "surface-container-highest": withOpacity("--surface-container-highest"),
        "surface-highlight": withOpacity("--surface-highlight"),
        surface: withOpacity("--surface"),
        "surface-bright": withOpacity("--surface-bright"),
        "surface-dim": withOpacity("--surface-dim"),
        "on-surface": withOpacity("--on-surface"),
        "on-surface-variant": withOpacity("--on-surface-variant"),
        outline: withOpacity("--outline"),
        "outline-variant": withOpacity("--outline-variant"),
        primary: withOpacity("--primary"),
        "primary-container": withOpacity("--primary-container"),
        "on-primary": withOpacity("--on-primary"),
        secondary: withOpacity("--secondary"),
        "secondary-container": withOpacity("--secondary-container"),
        "secondary-fixed": withOpacity("--secondary-fixed"),
        "secondary-fixed-dim": withOpacity("--secondary-fixed-dim"),
        tertiary: withOpacity("--tertiary"),
        "tertiary-container": withOpacity("--tertiary-container"),
        "on-tertiary": withOpacity("--on-tertiary"),
        error: withOpacity("--error"),
        "error-solid": withOpacity("--error-solid"),
        "error-container": withOpacity("--error-container"),
        "on-error": withOpacity("--on-error"),
        // Brand shortcut aliases
        brand: {
          charcoal: "#1E1E1E",
          darker: "#141414",
          surface: "#242424",
          gold: "#EBBD1C",
          yellow: "#F3EC51",
          cream: "#F8FAE0",
          blue: "#29388B",
          "blue-hover": "#212E72",
          gray: "#5E5E5E",
          muted: "#A8A8A3",
        },
      },
      fontFamily: {
        jakarta: [
          "var(--font-jakarta)",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        sans: [
          "var(--font-jakarta)",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-jakarta)",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-plex-mono)",
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        // Legacy aliases diarahkan ke Plus Jakarta Sans agar transisi halaman lain konsisten
        bebas: [
          "var(--font-jakarta)",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        montserrat: [
          "var(--font-jakarta)",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      keyframes: {
        pageEnter: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        slideFadeIn: {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        modalEnter: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "page-enter": "pageEnter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-fade-in":
          "slideFadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pop-in": "popIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "modal-enter":
          "modalEnter 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 1.8s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
