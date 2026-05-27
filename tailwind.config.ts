import type { Config } from 'tailwindcss';
import { THEME_COLORS } from './src/constants/theme';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/constants/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: THEME_COLORS.background,
        foreground: THEME_COLORS.foreground,
        primary: THEME_COLORS.primary,
        indigo: THEME_COLORS.indigo,
      },
    },
  },
  plugins: [],
};

export default config;
