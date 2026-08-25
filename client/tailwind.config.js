/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#050816",
          secondary: "#080B1A",
        },
        card: {
          DEFAULT: "#0D1224",
          elevated: "#11172B",
        },
        editor: {
          bg: "#080C18",
        },
        accent: {
          primary: "#7C3AED",
          secondary: "#6366F1",
          bright: "#8B5CF6",
          highlight: "#A78BFA",
        },
        border: {
          primary: "#1E293B",
          subtle: "#172033",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
