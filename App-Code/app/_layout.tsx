import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Toast } from '@/components/ui';

function NavigationGuard() {
  const { token, loading, initializeAuth, activeDivision, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Load auth state on app startup
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Monitor auth status and navigate accordingly
  useEffect(() => {
    if (loading) return;

    const segmentsList = segments as string[];
    const inAuthGroup = segmentsList[0] === '(auth)';
    const inSuperadmin = segmentsList[0] === '(superadmin)';
    const inFitpass = segmentsList[0] === '(fitpass)';
    const inH4 = segmentsList[0] === '(h4)';
    const onPortalSelection = inSuperadmin && segmentsList[1] === 'portal-selection';

    if (!token) {
      // Unauthenticated: go to gateway landing
      if (!inAuthGroup) {
        router.replace('/(auth)/landing');
      }
      return;
    }

    // Authenticated — resolve correct destination
    const role = user?.role;
    const isStaff = role && ['superadmin', 'partner', 'admin', 'trainer', 'receptionist', 'fitpass_admin', 'h4_admin'].includes(role);
    const isMember = role === 'member';

    if (isStaff) {
      // Staff/admin portal
      if (activeDivision === null) {
        if (!onPortalSelection) router.replace('/(superadmin)/portal-selection');
      } else {
        if (inAuthGroup || onPortalSelection || !segmentsList[0]) {
          router.replace('/(superadmin)/dashboard');
        }
      }
    } else if (isMember && activeDivision === 'h4') {
      // H4 member portal
      if (!inH4) router.replace('/(h4)/dashboard');
    } else if (isMember && activeDivision === 'fitpass') {
      // FitPass member portal
      if (!inFitpass) router.replace('/(fitpass)/dashboard');
    } else if (isMember && activeDivision === null) {
      // Member logged in but division not yet set — go back to landing
      if (!inAuthGroup) router.replace('/(auth)/landing');
    }
  }, [token, loading, activeDivision, user, segments, router]);

  return <Slot />;
}


import { useThemeStore } from '@/design-system/theme';

export default function RootLayout() {
  const { themeMode, initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <SafeAreaProvider key={themeMode}>
      <QueryClientProvider client={queryClient}>
        <NavigationGuard />
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
