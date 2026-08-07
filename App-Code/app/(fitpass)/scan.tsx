import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/design-system/theme';
import { FitPassQRScan } from '@/features/fitpass';

export default function ScanScreen() {
  return (
    <View style={styles.root}>
      <FitPassQRScan />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
