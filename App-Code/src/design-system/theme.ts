import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { radii, spacing, typography, palette } from './tokens';

// Spacing, Colors, Typography, and Radii design tokens for GYM-CRM Mobile App
//
// Color values shared between light and dark mode (brand primary, status
// colors, accent) live once in `tokens.ts`'s `palette` and are spread here.
// Only mode-specific values (background/card/text/border/etc.) are declared
// per-theme below — this is the single source of truth for the app's colors.

// Light Theme colors (Vibrant Electric Orange Theme)
export const lightColors = {
  ...palette,
  background: '#FFFFFF',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#1A1510',
  border: '#EAE7E1',
  notification: palette.accent,
  textSecondary: '#655B50',
  textMuted: '#9B9084',
  textInverse: '#FFFFFF',
  bgTertiary: '#F8F6F0',
  borderFocus: palette.primary,
  brandLight: '#FFF0EA',
  // FitPass portal uses a blue accent (vs. H4's orange) to visually
  // distinguish the two portals — documented here instead of a stray hex
  // repeated across CustomTabBar/GymDiscoveryExplore/etc.
  fitpassAccent: '#2563EB',
  fitpassAccentMuted: '#EFF6FF',
};

// Dark Theme colors (Premium Dark Theme with Vibrant Orange accent)
export const darkColors = {
  ...palette,
  background: '#231D14', // Very dark warm brown-black
  card: '#2D251C', // Dark warm brown card/surface
  surface: '#2D251C',
  text: '#FFFFFF', // White text
  border: '#3A3025', // Warm brown border
  notification: palette.accent,
  textSecondary: '#A39686',
  textMuted: '#6D6154',
  textInverse: '#231D14',
  bgTertiary: '#3A3025',
  borderFocus: palette.primary,
  brandLight: '#3F2518',
  fitpassAccent: '#2563EB',
  fitpassAccentMuted: '#1E3A5F',
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
