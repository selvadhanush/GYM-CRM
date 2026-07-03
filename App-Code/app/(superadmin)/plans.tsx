import React from 'react';
import { SafeAreaWrapper } from '@/components/layout';
import { FitPrimePlansList } from '@/features/superadmin';

export default function PlansScreen() {
  return (
    <SafeAreaWrapper scrollable={false}>
      <FitPrimePlansList />
    </SafeAreaWrapper>
  );
}
