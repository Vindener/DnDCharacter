import { darkColors } from '@/shared/styles/theme';

export const DarkTheme = {
  dark: true,
  colors: {
    primary: darkColors.primary,
    background: darkColors.background,
    card: darkColors.card,
    text: darkColors.text,
    border: darkColors.border,
    notification: darkColors.info,
  },
};

export type Theme = typeof DarkTheme;
