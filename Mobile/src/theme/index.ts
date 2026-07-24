import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const COLORS = {
  // Brand Warm Amber-Gold
  primary: '#F0A020',
  primaryLight: '#FCE6B8',
  primaryDark: '#D9860F',

  // Accents
  secondary: '#D9860F',
  accent: '#D9860F',

  // Status
  success: '#2E7D32',
  successLight: '#4ADE80',
  warning: '#F0A020',
  warningDark: '#D9860F',
  danger: '#C62828',
  dangerLight: '#EF5350',

  // Dark Backgrounds (Spatial)
  backgroundDark: '#231D14',
  backgroundCard: '#2D251C',
  backgroundElevated: '#3A3025',
  backgroundInput: '#2D251C',
  surface: '#2D251C',
  surfaceLight: '#3A3025',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A39686',
  textMuted: '#6D6154',
  textInverse: '#231D14',

  // Borders
  border: '#3A3025',
  borderLight: '#2D251C',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.6)',

  gradient: {
    primary: ['#F0A020', '#D9860F'] as const,
    secondary: ['#D9860F', '#B36B00'] as const,
    accent: ['#F0A020', '#D9860F'] as const,
    dark: ['#231D14', '#2D251C'] as const,
    card: ['#2D251C', '#231D14'] as const,
    hero: ['rgba(240,160,32,0.2)', 'rgba(240,160,32,0)'] as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const FONTS = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
  black: { fontWeight: '900' as const },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 30,
    hero: 40,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#F0A020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#F0A020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#F0A020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const LAYOUT = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallScreen: SCREEN_WIDTH < 375,
};
