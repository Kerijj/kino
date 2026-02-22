import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        wine: "#722f37",
        paper: "#f4f1ea",
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        mono: ['Courier Prime', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
