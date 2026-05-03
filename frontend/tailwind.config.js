/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0A14",
        plasma: "#7B61FF",
        "plasma-light": "#A695FF",
        ghost: "#F0EFF4",
        graphite: "#18181B",
        "graphite-light": "#27272A",
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
        instrument: ["Instrument Serif", "serif"],
        fira: ["Fira Code", "monospace"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        blink: "blink 1.2s step-end infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(24px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};
