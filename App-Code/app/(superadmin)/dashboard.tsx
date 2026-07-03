import React from 'react';
import { SafeAreaWrapper } from '@/components/layout';
import { SuperAdminDashboard } from '@/features/superadmin';

export default function DashboardScreen() {
  return (
    <SafeAreaWrapper scrollable={false}>
      <SuperAdminDashboard />
    </SafeAreaWrapper>
  );
}
