import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Safelist dynamic grid-cols used by CompareMode
  safelist: ["grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"],
  theme: {
    extend: {
      colors: {
        mmp: {
          bg: "#faf9f6",
          accent: "#D85A30",
          sidebar: "#0e0e0e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
