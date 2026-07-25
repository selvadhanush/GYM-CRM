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
    primary: '#FF5F1F', // Vibrant Electric Orange
    primaryHover: '#E04E10', // Dark Amber / Gold
    primaryLight: '#FFECE5', // Soft Amber Tint
    primaryMuted: '#FFF3EE', // Cream/Soft Amber Card Accent
  },
  accent: '#D9860F', // Dark Amber / Gold
  status: {
    success: '#2E7D32', // Active Pass - Green
    warning: '#FF5F1F', // Warning - Orange
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
    focus: '#FF5F1F',
  },
};

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: '900' as const,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  h1: {
    fontSize: 26,
    fontWeight: '900' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '800' as const,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700' as const,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 19,
  },
  caption: {
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

