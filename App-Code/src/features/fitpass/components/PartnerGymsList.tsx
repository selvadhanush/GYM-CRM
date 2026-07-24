import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { Building2, MapPin, Phone, Search, Zap, CheckCircle2 } from 'lucide-react-native';
import { usePartnerGyms } from '../api/fitpass.api';

export function PartnerGymsList() {
  const { data: gyms, isLoading } = usePartnerGyms();
  const [search, setSearch] = useState('');

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
  const filtered = list.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    (g.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Typography variant="h1" style={styles.title}>Partner Gyms</Typography>
          <Typography variant="caption" color="secondary">FitPass Network Gyms & Branches</Typography>
        </View>
        <Badge label={`${list.length} Gyms`} variant="info" />
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Search size={16} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by gym name or location..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState title="No Gyms Found" description={search ? `No gym matching "${search}"` : "No partner gyms available right now."} />
      ) : (
        filtered.map((gym) => (
          <Card key={gym._id || gym.id} style={styles.gymCard}>
            <View style={styles.gymHeader}>
              <View style={styles.gymIcon}>
                <Building2 size={22} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h3" style={{ flex: 1 }}>{gym.name}</Typography>
                  <View style={styles.fitpassBadge}>
                    <Zap size={11} color={theme.colors.primary} />
                    <Typography variant="caption" style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700', marginLeft: 3 }}>FITPASS</Typography>
                  </View>
                </View>
                {gym.address ? (
                  <View style={styles.locationRow}>
                    <MapPin size={12} color={theme.colors.textSecondary} />
                    <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.xs, flex: 1 }} numberOfLines={1}>
                      {gym.address}
                    </Typography>
                  </View>
                ) : null}
              </View>
            </View>

            {gym.phone ? (
              <TouchableOpacity
                style={styles.callRow}
                onPress={() => Linking.openURL(`tel:${gym.phone}`)}
              >
                <Phone size={12} color={theme.colors.primary} />
                <Typography variant="caption" style={{ color: theme.colors.primary, marginLeft: theme.spacing.xs }}>
                  Call Gym: {gym.phone}
                </Typography>
              </TouchableOpacity>
            ) : null}

            {gym.branches && gym.branches.length > 0 && (
              <View style={styles.branchesSection}>
                <Typography variant="caption" color="muted" style={{ marginBottom: theme.spacing.xs }}>Active Branches:</Typography>
                <View style={styles.branches}>
                  {gym.branches
                    .filter((b: any) => b.fitPassEnabled !== false)
                    .map((branch: any) => (
                      <View key={branch._id || branch.id} style={styles.branchChip}>
                        <CheckCircle2 size={10} color={theme.colors.success} />
                        <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>{branch.name}</Typography>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  title: { color: theme.colors.text, margin: 0 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    marginLeft: theme.spacing.xs,
  },
  gymCard: { padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  gymHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  gymIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(240, 160, 32, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fitpassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 160, 32, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs },
  callRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm, paddingTop: theme.spacing.xs, borderTopWidth: 1, borderTopColor: theme.colors.border },
  branchesSection: { marginTop: theme.spacing.sm },
  branches: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  branchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  skeletonCard: { height: 110, borderRadius: theme.radii.md, marginBottom: theme.spacing.sm },
});
