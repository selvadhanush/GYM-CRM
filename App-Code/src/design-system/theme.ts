import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { radii, spacing, typography } from './tokens';

// Spacing, Colors, Typography, and Radii design tokens for GYM-CRM Mobile App
// Compliance: AGENTS.md §5

// Light Theme colors (Vibrant Electric Orange Theme)
export const lightColors = {
  primary: '#FF5F1F', // Vibrant Electric Orange
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1A1510',
  border: '#EAE7E1',
  notification: '#E04E10',
  textSecondary: '#655B50',
  textMuted: '#9B9084',
  textInverse: '#FFFFFF',
  accent: '#E04E10',
  success: '#2E7D32',
  warning: '#FF5F1F',
  error: '#C62828',
  info: '#1976D2',
  bgTertiary: '#F8F6F0',
  borderFocus: '#FF5F1F',
  brandLight: '#FFF0EA',
  brandMuted: 'rgba(255, 95, 31, 0.18)',
};

// Dark Theme colors (Premium Dark Theme with Vibrant Orange accent)
export const darkColors = {
  primary: '#FF5F1F', // Vibrant Electric Orange
  background: '#231D14', // Very dark warm brown-black
  card: '#2D251C', // Dark warm brown card/surface
  text: '#FFFFFF', // White text
  border: '#3A3025', // Warm brown border
  notification: '#E04E10',
  textSecondary: '#A39686',
  textMuted: '#6D6154',
  textInverse: '#231D14',
  accent: '#E04E10',
  success: '#2E7D32',
  warning: '#FF5F1F',
  error: '#C62828',
  info: '#1976D2',
  bgTertiary: '#3A3025',
  borderFocus: '#FF5F1F',
  brandLight: '#3F2518',
  brandMuted: 'rgba(255, 95, 31, 0.18)',
};

// Global reactive reference for active theme mode
export let activeThemeMode: 'light' | 'dark' = 'light'; // Default to light minimalistic theme

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
  themeMode: 'light', // Default to minimalistic light theme
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
