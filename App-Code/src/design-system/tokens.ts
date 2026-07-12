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

export const colors = {
  brand: {
    primary: '#FFE01B', // Primary Brand Yellow
    primaryHover: '#F5D000', // Primary Hover
    primaryLight: '#FFF4A3', // Primary Light
    primaryMuted: 'rgba(255, 224, 27, 0.15)',
  },
  accent: '#E6C800', // Primary Dark / Accent Yellow
  status: {
    success: '#16A34A', // Success Green
    warning: '#F59E0B', // Warning Orange
    error: '#DC2626', // Danger Red
    info: '#2563EB', // Info Blue
  },
  background: {
    primary: '#FFFFFF', // Clean White Background
    secondary: '#FAFAFA', // Soft Gray Secondary Background
    tertiary: '#FFFFFF', // Modals / Cards Background
  },
  text: {
    primary: '#111827', // Primary Dark Gray/Black Text
    secondary: '#4B5563', // Secondary text
    muted: '#6B7280', // Muted text
    inverse: '#111827', // Black text on yellow buttons
  },
  border: {
    default: '#E5E7EB', // Subtle Gray border
    focus: '#FFE01B',
  },
};

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    fontFamily: 'System', // Cleaner enterprise fonts
  },
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 31,
    fontFamily: 'System',
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    fontFamily: 'System',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 25,
    fontFamily: 'System',
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: 'System',
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
    fontFamily: 'System',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 17,
    fontFamily: 'System',
  },
};

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  full: 9999,
};

