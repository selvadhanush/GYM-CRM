import React from 'react';
import { SafeAreaWrapper } from '@/components/layout';
import { AdminManagementList } from '@/features/superadmin';

export default function AdminsScreen() {
  return (
    <SafeAreaWrapper scrollable={false}>
      <AdminManagementList />
    </SafeAreaWrapper>
  );
}
