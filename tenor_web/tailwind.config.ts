import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        "app-primary": "#086A72",
        "app-secondary": "#13918A",
        "app-tertiary": "#15634F",
        "app-dark": "#012112",
        "app-light": "#88BB87",
        "app-success": "#184723",
        "app-fail": "#EA2B4E",
        "app-text": "#1F2329",
        "app-border": "#BECAD4",
      }
    },
  },
  plugins: [],
} satisfies Config;
