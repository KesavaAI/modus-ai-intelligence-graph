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
        background: "var(--background)",
        foreground: "var(--foreground)",
        nodeProcess: "#3B82F6",
        nodeActivity: "#8B5CF6",
        nodeRole: "#F59E0B",
        nodeSkill: "#10B981",
      },
    },
  },
  plugins: [],
};
export default config;
