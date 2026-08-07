import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@/design-system/theme';
import { GymDiscoveryExplore } from '@/features/fitpass';

export default function FitPassGymsScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <GymDiscoveryExplore />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
