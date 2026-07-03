import React from 'react';
import { SafeAreaWrapper } from '@/components/layout';
import { H4ManagementHub, BranchSelector } from '@/features/superadmin';

export default function OpsHubScreen() {
  return (
    <SafeAreaWrapper scrollable>
      <BranchSelector />
      <H4ManagementHub />
    </SafeAreaWrapper>
  );
}
