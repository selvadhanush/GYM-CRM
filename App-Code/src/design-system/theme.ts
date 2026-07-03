import { colors, radii, spacing, typography } from './tokens';

export const DarkTheme = {
  dark: true,
  colors: {
    primary: colors.brand.primary,
    background: colors.background.primary,
    card: colors.background.secondary,
    text: colors.text.primary,
    border: colors.border.default,
    notification: colors.accent,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    textInverse: colors.text.inverse,
    accent: colors.accent,
    success: colors.status.success,
    warning: colors.status.warning,
    error: colors.status.error,
    info: colors.status.info,
    bgTertiary: colors.background.tertiary,
    borderFocus: colors.border.focus,
    brandLight: colors.brand.primaryLight,
    brandMuted: colors.brand.primaryMuted,
  },
  radii,
  spacing,
  typography,
};

export type AppTheme = typeof DarkTheme;
export const theme = DarkTheme; // Default to dark theme for premium neon gym styling
