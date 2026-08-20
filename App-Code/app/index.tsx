import React from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Text } from 'react-native';
import { theme } from '@/design-system/theme';
import { fontFamilies } from '@/design-system/tokens';

const H4_LOGO = require('../assets/h4.jpeg');

// Branded splash shown while auth state resolves — previously a bare spinner
// on a blank background, which read as a stalled/broken app for a moment.
export default function IndexScreen() {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.logoBadge, { borderColor: theme.colors.primary }]}>
        <Image source={H4_LOGO} style={styles.logoImage} resizeMode="cover" />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>ZIPPY FIT PRIME</Text>
      <ActivityIndicator size="small" color={theme.colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: fontFamilies.header,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  spinner: {
    marginTop: 8,
  },
});
