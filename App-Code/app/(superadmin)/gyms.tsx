import React from 'react';
import { SafeAreaWrapper } from '@/components/layout';
import { PartnerGymsList } from '@/features/superadmin';

export default function GymsScreen() {
  return (
    <SafeAreaWrapper scrollable={false}>
      <PartnerGymsList />
    </SafeAreaWrapper>
  );
}
