import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge, Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useSessionStatus } from '../api/fitpass.api';
import { User, Mail, Phone, Building2, Ticket } from 'lucide-react-native';

export function FitPassProfile() {
  const user = useAuth((s) => s.user);
  const { data: session, isLoading } = useSessionStatus();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h1" style={styles.title}>Profile</Typography>

      {/* User Info */}
      <Card style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Typography variant="h1" style={{ color: theme.colors.primary }}>
              {(user?.name?.[0] ?? 'F').toUpperCase()}
            </Typography>
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h2">{user?.name ?? '—'}</Typography>
            <Badge label="FitPass Member" variant="info" />
          </View>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Mail size={14} color={theme.colors.textSecondary} />
            <Typography variant="bodySm" color="secondary">{user?.email ?? '—'}</Typography>
          </View>
        </View>
      </Card>

      {/* Pass Status */}
      <Card style={styles.card}>
        <Typography variant="h3" style={styles.cardTitle}>Pass Status</Typography>
        {isLoading ? (
          <Skeleton style={{ height: 80, borderRadius: theme.radii.md }} />
        ) : (
          <View style={styles.passGrid}>
            <View style={styles.passStat}>
              <Typography variant="h1" style={{ color: theme.colors.primary }}>
                {session?.sessionsRemaining ?? 0}
              </Typography>
              <Typography variant="caption" color="secondary">Sessions Left</Typography>
            </View>
            <View style={styles.passStat}>
              <Badge
                label={session?.planStatus ?? 'Unknown'}
                variant={session?.planStatus === 'Active' ? 'active' : 'expired'}
              />
            </View>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  title: { color: theme.colors.text, marginBottom: theme.spacing.md },
  card: { padding: theme.spacing.md, marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  cardTitle: { color: theme.colors.text, marginBottom: theme.spacing.sm },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoList: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  passGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  passStat: { alignItems: 'center', gap: theme.spacing.xs },
});
