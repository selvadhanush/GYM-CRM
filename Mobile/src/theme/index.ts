import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const COLORS = {
  // Brand Orange
  primary: '#FF7A00',
  primaryLight: '#FF9F40',
  primaryDark: '#E65C00',

  // Accents
  secondary: '#00D4AA',
  accent: '#A78BFA',

  // Status
  success: '#22C55E',
  successLight: '#4ADE80',
  warning: '#F59E0B',
  warningDark: '#D97706',
  danger: '#EF4444',
  dangerLight: '#F87171',

  // Dark Backgrounds (Spatial) -> Now Light
  backgroundDark: '#FFFFFF',
  backgroundCard: '#F8F9FA',
  backgroundElevated: '#F0F0F0',
  backgroundInput: '#E5E7EB',
  surface: '#F9FAFB',
  surfaceLight: '#FFFFFF',

  // Text
  textPrimary: '#000000',
  textSecondary: '#444444',
  textMuted: '#666666',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.6)',

  gradient: {
    primary: ['#FF7A00', '#E65C00'] as const,
    secondary: ['#00D4AA', '#009977'] as const,
    accent: ['#A78BFA', '#7C3AED'] as const,
    dark: ['#0A0A0F', '#12121A'] as const,
    card: ['#1A1A26', '#12121A'] as const,
    hero: ['rgba(255,122,0,0.2)', 'rgba(255,122,0,0)'] as const,
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
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#FF7A00',
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
