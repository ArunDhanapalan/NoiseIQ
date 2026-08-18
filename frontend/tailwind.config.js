import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      colors: {
        noise: {
          quiet: '#10B981',    // <55 dB (Green)
          moderate: '#F59E0B', // 55-70 dB (Amber)
          violation: '#EF4444' // >70 dB (Red)
        }
      }
    },
  },
  plugins: [
    daisyui
  ],
  daisyui: {
    themes: ["emerald", "corporate", "dark", "dim"],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
}
