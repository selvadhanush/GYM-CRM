import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '@/design-system/theme';

export type BadgeVariant = 'active' | 'expired' | 'frozen' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', style }) => {
  const getBadgeColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'active':
      case 'success':
        return { bg: 'rgba(0, 255, 102, 0.1)', text: theme.colors.success };
      case 'expired':
      case 'error':
        return { bg: 'rgba(255, 0, 68, 0.1)', text: theme.colors.error };
      case 'frozen':
      case 'warning':
        return { bg: 'rgba(255, 214, 0, 0.1)', text: theme.colors.warning };
      case 'info':
      default:
        return { bg: 'rgba(0, 255, 255, 0.1)', text: theme.colors.info };
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...theme.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
