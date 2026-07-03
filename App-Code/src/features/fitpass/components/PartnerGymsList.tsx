import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Skeleton, EmptyState } from '@/components/ui';
import { Building2, MapPin } from 'lucide-react-native';
import { usePartnerGyms } from '../api/fitpass.api';

export function PartnerGymsList() {
  const { data: gyms, isLoading } = usePartnerGyms();

  if (isLoading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  const list = Array.isArray(gyms) ? gyms : [];
  if (list.length === 0) {
    return <EmptyState title="No Gyms" description="No partner gyms available." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Partner Gyms</Typography>
      {list.map((gym) => (
        <Card key={gym.id} style={styles.gymCard}>
          <View style={styles.gymHeader}>
            <View style={styles.gymIcon}>
              <Building2 size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="h3">{gym.name}</Typography>
              {gym.city && (
                <View style={styles.locationRow}>
                  <MapPin size={12} color={theme.colors.textSecondary} />
                  <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.xs }}>
                    {gym.city}
                  </Typography>
                </View>
              )}
            </View>
          </View>

          {gym.branches && gym.branches.length > 0 && (
            <View style={styles.branches}>
              {gym.branches
                .filter((b) => b.fitPassEnabled)
                .map((branch) => (
                  <View key={branch.id} style={styles.branchChip}>
                    <Typography variant="caption" color="secondary">{branch.name}</Typography>
                  </View>
                ))}
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  title: { color: theme.colors.text, marginBottom: theme.spacing.md },
  gymCard: { padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  gymHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  gymIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs },
  branches: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: theme.spacing.sm },
  branchChip: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  skeletonCard: { height: 100, borderRadius: theme.radii.md, marginBottom: theme.spacing.sm },
});
