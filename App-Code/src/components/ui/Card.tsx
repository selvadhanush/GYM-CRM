import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '@/design-system/theme';

interface CardProps {
  children: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, accentColor, style }) => {
  return (
    <View
      style={[
        styles.card,
        accentColor ? { borderLeftWidth: 5, borderLeftColor: accentColor } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
