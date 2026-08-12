import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/design-system/theme';
import { H4QRScan } from '@/features/h4';

export default function H4ScanScreen() {
  return (
    <View style={styles.root}>
      <H4QRScan />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
