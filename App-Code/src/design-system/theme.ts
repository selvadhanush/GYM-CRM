import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { radii, spacing, typography } from './tokens';

// Spacing, Colors, Typography, and Radii design tokens for GYM-CRM Mobile App
// Compliance: AGENTS.md §5

// Light Theme colors (Premium Warm Amber-Gold Light Theme)
export const lightColors = {
  primary: '#F0A020',
  background: '#FBFBF9',
  card: '#FFFFFF',
  text: '#231D14',
  border: '#E6E2DC',
  notification: '#D9860F',
  textSecondary: '#6D6154',
  textMuted: '#A39686',
  textInverse: '#FFFFFF',
  accent: '#D9860F',
  success: '#2E7D32',
  warning: '#F0A020',
  error: '#C62828',
  info: '#1976D2',
  bgTertiary: '#F5F3EF',
  borderFocus: '#F0A020',
  brandLight: '#FCE6B8',
  brandMuted: 'rgba(240, 160, 32, 0.15)',
};

// Dark Theme colors (Premium Amber-Gold Dark Theme)
export const darkColors = {
  primary: '#F0A020', // Amber-Gold
  background: '#231D14', // Very dark warm brown-black
  card: '#2D251C', // Dark warm brown card/surface
  text: '#FFFFFF', // White text
  border: '#3A3025', // Warm brown border
  notification: '#D9860F',
  textSecondary: '#A39686',
  textMuted: '#6D6154',
  textInverse: '#231D14',
  accent: '#D9860F',
  success: '#2E7D32',
  warning: '#F59E0B',
  error: '#C62828',
  info: '#1976D2',
  bgTertiary: '#3A3025',
  borderFocus: '#F0A020',
  brandLight: '#FCE6B8',
  brandMuted: 'rgba(240, 160, 32, 0.15)',
};

// Global reactive reference for active theme mode
export let activeThemeMode: 'light' | 'dark' = 'dark'; // Default to dark premium theme

export function setActiveThemeMode(mode: 'light' | 'dark') {
  activeThemeMode = mode;
}

// Zustand store for managing app theme mode
interface ThemeState {
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'dark', // Default to premium dark base theme
  initTheme: async () => {
    try {
      const saved = await storage.getItem('app-theme');
      if (saved === 'light' || saved === 'dark') {
        setActiveThemeMode(saved);
        set({ themeMode: saved });
      }
    } catch (e) {
      console.error('Failed to init app theme:', e);
    }
  },
  toggleTheme: async () => {
    set((state) => {
      const newMode = state.themeMode === 'light' ? 'dark' : 'light';
      storage.setItem('app-theme', newMode);
      setActiveThemeMode(newMode);
      return { themeMode: newMode };
    });
  },
}));

// Dynamic proxy theme to maintain full backwards compatibility with static imports
export const theme = {
  get dark() {
    return activeThemeMode === 'dark';
  },
  get colors() {
    return activeThemeMode === 'dark' ? darkColors : lightColors;
  },
  radii,
  spacing,
  typography,
};

export type AppTheme = typeof theme;
