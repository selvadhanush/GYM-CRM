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
  const getBadgeColors = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'active':
      case 'success':
        return { bg: 'rgba(46, 125, 50, 0.12)', text: '#2E7D32', border: 'rgba(46, 125, 50, 0.3)' };
      case 'expired':
      case 'error':
        return { bg: 'rgba(198, 40, 40, 0.12)', text: '#C62828', border: 'rgba(198, 40, 40, 0.3)' };
      case 'frozen':
      case 'warning':
        return { bg: 'rgba(217, 155, 0, 0.15)', text: '#D99B00', border: 'rgba(217, 155, 0, 0.35)' };
      case 'info':
      default:
        return { bg: 'rgba(255, 224, 27, 0.18)', text: '#1A1510', border: 'rgba(255, 224, 27, 0.45)' };
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
