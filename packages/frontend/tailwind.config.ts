import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(0 0% 90%)",
        background: "hsl(0 0% 98%)",
        foreground: "hsl(0 0% 9%)",
        muted: "hsl(0 0% 96%)",
        "muted-foreground": "hsl(0 0% 45%)",
        card: "hsl(0 0% 100%)",
        "card-foreground": "hsl(0 0% 9%)",
        primary: "hsl(0 0% 9%)",
        "primary-foreground": "hsl(0 0% 98%)",
        secondary: "hsl(0 0% 96%)",
        "secondary-foreground": "hsl(0 0% 9%)",
        accent: "hsl(217 91% 60%)",
        "accent-foreground": "hsl(0 0% 98%)",
        destructive: "hsl(0 84% 60%)",
        ring: "hsl(0 0% 9%)",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
