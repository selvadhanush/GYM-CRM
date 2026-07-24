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
    primary: '#F0A020', // Amber / Brand Gold
    primaryHover: '#D9860F', // Dark Amber / Gold
    primaryLight: '#FCE6B8', // Soft Amber Tint
    primaryMuted: '#FBF6EC', // Cream/Soft Amber Card Accent
  },
  accent: '#D9860F', // Dark Amber / Gold
  status: {
    success: '#2E7D32', // Active Pass - Green
    warning: '#F0A020', // Warning - Amber
    error: '#C62828', // Expired Session - Red
    info: '#1976D2', // Cooldown - Blue
  },
  background: {
    primary: '#231D14', // Very dark warm brown-black background
    secondary: '#2D251C', // Dark warm brown card/surface background
    tertiary: '#2D251C',
  },
  text: {
    primary: '#FFFFFF', // Pure white for high-contrast titles
    secondary: '#A39686', // Warm muted brown-gray body text
    muted: '#6D6154', // Muted warm brown-gray for captions
    inverse: '#231D14', // Inverse text
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

