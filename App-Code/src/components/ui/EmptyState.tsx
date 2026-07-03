import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '@/design-system/theme';

interface EmptyStateProps {
  iconText?: string;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconText = '📁',
  title,
  description,
  actionButton,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{iconText}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionButton && <View style={styles.actionContainer}>{actionButton}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: theme.spacing.md,
    width: '100%',
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  actionContainer: {
    marginTop: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
});
