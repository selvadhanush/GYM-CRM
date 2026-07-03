import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { theme } from '@/design-system/theme';

export type TypographyVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption';
export type TypographyColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand' | 'success' | 'warning' | 'error';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  children: React.ReactNode;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  children,
  align = 'left',
  style,
  ...props
}) => {
  const getStyleForVariant = (): TextStyle => {
    switch (variant) {
      case 'display':
        return theme.typography.display;
      case 'h1':
        return theme.typography.h1;
      case 'h2':
        return theme.typography.h2;
      case 'h3':
        return theme.typography.h3;
      case 'bodySm':
        return theme.typography.bodySm;
      case 'caption':
        return theme.typography.caption;
      case 'body':
      default:
        return theme.typography.body;
    }
  };

  const getColorForType = (): string => {
    switch (color) {
      case 'secondary':
        return theme.colors.textSecondary;
      case 'muted':
        return theme.colors.textMuted;
      case 'inverse':
        return theme.colors.textInverse;
      case 'brand':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      case 'primary':
      default:
        return theme.colors.text;
    }
  };

  return (
    <Text
      style={[
        styles.text,
        getStyleForVariant(),
        { color: getColorForType(), textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'System', // Fallback to system fonts for native safety
  },
});
