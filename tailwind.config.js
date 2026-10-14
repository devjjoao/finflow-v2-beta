/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0a0e1a",
          soft: "#0f1420",
          card: "#131a2b",
          border: "#1e2740",
        },
        light: {
          DEFAULT: "#f4f6fb",
          soft: "#ffffff",
          card: "#ffffff",
          border: "#e3e8f2",
        },
        brand: {
          DEFAULT: "#3b82f6",
          soft: "#60a5fa",
          deep: "#2563eb",
          glow: "#1d4ed8",
        },
        ink: {
          DEFAULT: "#e7ecf7",
          muted: "#8b93a7",
          faint: "#5b6376",
        },
        positive: "#22c55e",
        negative: "#f43f5e",
        warn: "#f59e0b",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,130,246,0.15), 0 8px 24px -8px rgba(59,130,246,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
