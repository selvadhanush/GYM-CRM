import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { LoginForm } from '@/features/auth';

export default function LoginScreen() {
  const { portal } = useLocalSearchParams<{ portal: 'staff' | 'h4' | 'fitpass' }>();
  return <LoginForm portal={portal || 'staff'} />;
}
