import type { Config } from "tailwindcss"; 
const config: Config = {
  darkMode: "class",
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#6C5CE7", foreground: "#FFFFFF", 50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD", 400: "#A78BFA", 500: "#8B5CF6", 600: "#6C5CE7", 700: "#5B4BC4", 800: "#4C3A9E", 900: "#3D2E7D" },
        dark: { bg: "#0A0A0F", surface: "#12121A", border: "#1E1E2E" }
      },
      fontFamily: { sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"] },
      animation: { "gradient": "gradient 8s linear infinite", "float": "float 6s ease-in-out infinite" },
      keyframes: {
        gradient: { "0%, 100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-20px)" } }
      }
    },
  },
  plugins: [],
};
export default config;
