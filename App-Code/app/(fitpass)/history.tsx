import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@/design-system/theme';
import { CheckInHistory } from '@/features/fitpass';

export default function FitPassHistoryScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <CheckInHistory />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
