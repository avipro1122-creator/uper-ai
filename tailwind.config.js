/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#0A0A0A",
          card: "#111111",
          card2: "#161616",
          border: "#222222",
          border2: "#2A2A2A",
          text: "#E8E8E4",
          muted: "#66665F",
          muted2: "#888882",
        },
        signal: {
          green: "#00D4A0",
          "green-dim": "rgba(0,212,160,0.12)",
          red: "#FF4D4D",
          "red-dim": "rgba(255,77,77,0.12)",
          amber: "#F5A623",
          "amber-dim": "rgba(245,166,35,0.12)",
          blue: "#4A9EFF",
          purple: "#A78BFA",
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        pulse: "pulse 1.2s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      borderRadius: {
        terminal: "10px",
        "terminal-lg": "14px",
      },
    },
  },
  plugins: [],
};
