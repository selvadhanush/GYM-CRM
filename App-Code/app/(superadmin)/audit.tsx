import React from 'react';
import { SafeAreaWrapper } from '@/components/layout';
import { AuditLogsList } from '@/features/superadmin';

export default function AuditScreen() {
  return (
    <SafeAreaWrapper scrollable={false}>
      <AuditLogsList />
    </SafeAreaWrapper>
  );
}
