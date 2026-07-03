import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { theme } from '@/design-system/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { API_CLIENT } from '@/lib/api-client';
import { useBranches } from '../api/superadmin.api';
import { Select, Typography } from '@/components/ui';

export const BranchSelector: React.FC = () => {
  const { selectedBranchId, changeSelectedBranch, activeDivision } = useAuth();
  const { data: branches, isLoading } = useBranches();

  const { data: h4Gym } = useQuery({
    queryKey: ['h4-gym-details'],
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/superadmin/h4-gym');
      return data;
    },
    enabled: activeDivision === 'h4',
  });

  if (activeDivision !== 'h4') return null;

  const parentLabel = h4Gym?.name || 'H4';
  const options = [
    { label: parentLabel, value: '' },
    ...(branches || []).map((b) => ({ label: b.name, value: b._id })),
  ];

  return (
    <View style={styles.container}>
      <Typography variant="caption" color="secondary" style={styles.label}>
        Active Branch Context
      </Typography>
      <Select
        label=""
        options={options}
        value={selectedBranchId}
        onValueChange={(val) => changeSelectedBranch(String(val))}
        placeholder={isLoading ? "Loading branches..." : "Filter by branch"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
    fontSize: 11,
  },
});
