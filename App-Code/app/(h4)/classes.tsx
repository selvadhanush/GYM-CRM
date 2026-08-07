import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@/design-system/theme';
import { H4Classes } from '@/features/h4';

export default function H4ClassesScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <H4Classes />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
