import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@/design-system/theme';
import { PartnerGymsList } from '@/features/fitpass';

export default function FitPassGymsScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <PartnerGymsList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
