import React from 'react';
import { SafeAreaWrapper } from '@/components/layout';
import { PartnerGymsList, H4BranchControlHub } from '@/features/superadmin';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function GymsScreen() {
  const activeDivision = useAuth((s) => s.activeDivision);
  const isH4 = activeDivision === 'h4';

  return (
    <SafeAreaWrapper scrollable={false}>
      {isH4 ? <H4BranchControlHub /> : <PartnerGymsList />}
    </SafeAreaWrapper>
  );
}
