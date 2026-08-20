import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fontFamilies } from '@/design-system/tokens';
import { theme } from '@/design-system/theme';

export type BadgeVariant = 'active' | 'expired' | 'frozen' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', showDot = true, style }) => {
  // Derived from `theme.colors.*` status tokens (not a private palette) so
  // badges stay in sync with Toast/EmptyState/everything else.
  const getBadgeColors = (): { bg: string; text: string; border: string; dot: string } => {
    const fromStatus = (hex: string) => ({
      bg: `${hex}24`,
      text: hex,
      border: `${hex}4D`,
      dot: hex,
    });
    switch (variant) {
      case 'active':
      case 'success':
        return fromStatus(theme.colors.success);
      case 'expired':
      case 'error':
        return fromStatus(theme.colors.error);
      case 'frozen':
      case 'warning':
        return fromStatus(theme.colors.warning);
      case 'info':
      default:
        return fromStatus(theme.colors.info);
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }, style]}>
      {showDot && <View style={[styles.dot, { backgroundColor: colors.dot }]} />}
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    justifyContent: 'center',
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: fontFamilies.header,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
