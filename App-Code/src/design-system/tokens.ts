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
    primary: '#F0A020', // Warm Amber Gold
    primaryHover: '#D9860F', // Dark Amber Gold
    primaryLight: 'rgba(240, 160, 32, 0.1)',
    primaryMuted: 'rgba(240, 160, 32, 0.2)',
  },
  accent: '#FCE6B8', // Soft Amber Tint
  status: {
    success: '#2E7D32', // Active Pass - Green
    warning: '#D9860F',
    error: '#C62828', // Expired Session - Red
    info: '#1976D2', // Cooldown - Blue
  },
  background: {
    primary: '#231D14', // Very dark warm brown-black background
    secondary: '#2D251C', // Dark warm brown card background
    tertiary: '#3D3328', // Modals / popups background
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A39686', // Warm muted brown-gray
    muted: '#6D6154', // Muted warm brown-gray for captions
    inverse: '#000000',
  },
  border: {
    default: '#3A3025', // Warm brown border
    focus: '#F0A020',
  },
};

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    fontFamily: 'Oswald_600SemiBold',
  },
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 31,
    fontFamily: 'Oswald_600SemiBold',
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    fontFamily: 'Oswald_600SemiBold',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 25,
    fontFamily: 'Oswald_600SemiBold',
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
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
