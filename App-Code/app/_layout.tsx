import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Toast } from '@/components/ui';

function NavigationGuard() {
  const { token, loading, initializeAuth, activeDivision } = useAuth();
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
    const onPortalSelection = segmentsList[0] === '(superadmin)' && segmentsList[1] === 'portal-selection';

    if (!token) {
      // If no token, redirect to login page if we aren't already there
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else {
      // User is logged in
      if (activeDivision === null) {
        // Must select a portal/division first
        if (!onPortalSelection) {
          router.replace('/(superadmin)/portal-selection');
        }
      } else {
        // Portal selected, redirect to dashboard if currently on auth group or selection page
        if (inAuthGroup || onPortalSelection || !segmentsList[0]) {
          router.replace('/(superadmin)/dashboard');
        }
      }
    }
  }, [token, loading, activeDivision, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationGuard />
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
