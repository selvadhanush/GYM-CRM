import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth';
import { COLORS } from '@/theme';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadStoredAuth, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === '(admin)';
    const inSuperAdminGroup = segments[0] === '(superadmin)';
    const inProtectedGroup = inTabsGroup || inAdminGroup || inSuperAdminGroup;

    // Helper: check if user is an admin/partner (gym owner created by superadmin)
    const isAdminRole = user?.role === 'admin' || user?.role === 'partner';
    const isMemberRole = user?.role === 'member';
    const isSuperAdminRole = user?.role === 'superadmin';

    if (!isAuthenticated && inProtectedGroup) {
      // Not logged in — send to login
      router.replace('/login' as any);
      return;
    }

    if (!isAuthenticated && !inProtectedGroup) {
      // Not logged in and on public page — fine
      return;
    }

    // Authenticated user — enforce role-based routing
    if (isSuperAdminRole) {
      if (!inSuperAdminGroup) {
        router.replace('/(superadmin)' as any);
      }
    } else if (isAdminRole) {
      // Partners/admins can ONLY access (admin) group
      if (!inAdminGroup) {
        router.replace('/(admin)' as any);
      }
    } else if (isMemberRole) {
      // Members can ONLY access (tabs) group
      if (!inTabsGroup) {
        router.replace('/(tabs)' as any);
      }
    } else if (isAuthenticated && !inProtectedGroup) {
      // Authenticated but role unknown — default to tabs
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, segments, user]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.backgroundDark },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(superadmin)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
});
