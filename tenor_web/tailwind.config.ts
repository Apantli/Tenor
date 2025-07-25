import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx", "./src/**/*.ts"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        "app-primary": "#086A72",
        "app-secondary": "#13918A",
        "app-secondary-dark": "#0E766F",
        "app-tertiary": "#15634F",
        "app-dark": "#012112",
        "app-light": "#88BB87",
        "app-success": "#15734F",
        "app-fail": "#EA2B4E",
        "app-text": "#1F2329",
        "app-border": "#BECAD4",

        "app-hover-border": "#e8e8e8",
        "app-hover-primary": "#07585e",
        "app-hover-secondary": "#1b6963",
        "app-hover-fail": "#ab1530",

        "sprint-column-background": "#F1F2F4",
        "sprint-column-background-hovered": "#e6e7eb",
        "app-green": "#6BC46A",
      },
      keyframes: {
        "pulse-and-grow": {
          "0%": {
            transform: "scale(1)",
            opacity: "0.5",
          },
          "50%": {
            transform: "scale(1.05)",
            opacity: "0.8",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "0.5",
          },
        },
      },
      animation: {
        "spin-slow": "spin var(--animation-speed) linear infinite",
        "pulse-and-grow":
          "pulse-and-grow var(--animation-speed) ease-in-out infinite",
        "hide-slow": "hide-slow 5s ease-in-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
