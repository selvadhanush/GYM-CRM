import React from 'react';
import { StyleSheet, ScrollView, StatusBar, ActivityIndicator, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/design-system/theme';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  scrollable = true,
  loading = false,
  style,
}) => {
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
