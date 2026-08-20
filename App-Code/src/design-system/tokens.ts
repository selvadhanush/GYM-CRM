// Spacing, Colors, Typography, and Radii design tokens for GYM-CRM Mobile App
// Compliance: AGENTS.md §5

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Canonical brand/status palette — the single source of truth for values that
// are shared between light and dark mode. `theme.ts`'s lightColors/darkColors
// spread this palette and only override the values that legitimately differ
// per mode (background, card, text, border, etc.). Don't redeclare these hex
// values anywhere else — import `palette` (via `theme.colors`) instead.
export const palette = {
  primary: '#FF5F1F', // Vibrant Electric Orange — brand primary
  primaryHover: '#E04E10',
  primaryLight: '#FFECE5',
  primaryMuted: '#FFF3EE',
  accent: '#E04E10', // Dark amber/gold accent, also used as `notification`
  success: '#2E7D32',
  warning: '#D97706', // Distinct amber — previously collided with `primary`
  error: '#C62828',
  info: '#1976D2',
  brandMuted: 'rgba(255, 95, 31, 0.18)',
};

// Deprecated nested shape, kept only so any stray import doesn't hard-crash.
// Prefer `theme.colors` (from `@/design-system/theme`) in new code.
export const colors = {
  brand: {
    primary: palette.primary,
    primaryHover: palette.primaryHover,
    primaryLight: palette.primaryLight,
    primaryMuted: palette.primaryMuted,
  },
  accent: palette.accent,
  status: {
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,
  },
  background: {
    primary: '#231D14',
    secondary: '#2D251C',
    tertiary: '#2D251C',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A39686',
    muted: '#6D6154',
    inverse: '#231D14',
  },
  border: {
    default: '#3A3025',
    focus: palette.primary,
  },
};

import { Platform } from 'react-native';

// NOTE: 'Oswald-Bold' is loaded via a web <link> in app/_layout.tsx, but no
// .ttf is bundled into the native app and no expo-font/useFonts call loads
// it there — on iOS/Android it was silently falling back to the system font
// while claiming to be Oswald. Until the font file is actually bundled, the
// native fallback is declared honestly as a bold system font so the display
// type scale renders consistently instead of pretending to be a font that
// isn't present.
export const fontFamilies = {
  header: Platform.select({
    web: "'Oswald', sans-serif",
    ios: 'System', // rendered bold via typography.*.fontWeight, see theme.ts
    android: 'sans-serif-condensed',
    default: 'sans-serif',
  }) as string,
  body: Platform.select({
    web: "'Google Sans Flex', 'Google Sans', 'Inter', sans-serif",
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }) as string,
};

export const typography = {
  display: {
    fontFamily: fontFamilies.header,
    fontSize: 34,
    fontWeight: '900' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fontFamilies.header,
    fontSize: 26,
    fontWeight: '900' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamilies.header,
    fontSize: 20,
    fontWeight: '800' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fontFamilies.header,
    fontSize: 17,
    fontWeight: '700' as const,
    lineHeight: 23,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 19,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 15,
    letterSpacing: 0.3,
  },
};

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  full: 9999,
};

