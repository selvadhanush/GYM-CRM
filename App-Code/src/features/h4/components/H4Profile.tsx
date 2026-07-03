import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useH4Plan } from '../api/h4.api';
import { User, Mail } from 'lucide-react-native';

export function H4Profile() {
  const user = useAuth((s) => s.user);
  const { data: plan } = useH4Plan();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h1" style={styles.title}>Profile</Typography>

      <Card style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Typography variant="h1" style={{ color: theme.colors.success }}>
              {(user?.name?.[0] ?? 'H').toUpperCase()}
            </Typography>
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h2">{user?.name ?? '—'}</Typography>
            <Badge label="H4 Member" variant="success" />
          </View>
        </View>
        <View style={styles.infoRow}>
          <Mail size={14} color={theme.colors.textSecondary} />
          <Typography variant="bodySm" color="secondary">{user?.email ?? '—'}</Typography>
        </View>
      </Card>

      <Card style={styles.card}>
        <Typography variant="h3" style={styles.cardTitle}>Membership</Typography>
        <View style={styles.planRow}>
          <Typography variant="caption" color="secondary">Plan</Typography>
          <Typography variant="bodySm">{plan?.planName ?? '—'}</Typography>
        </View>
        <View style={styles.planRow}>
          <Typography variant="caption" color="secondary">Status</Typography>
          <Badge
            label={plan?.status ?? 'Unknown'}
            variant={plan?.status === 'Active' ? 'active' : 'expired'}
          />
        </View>
        {plan?.expiryDate && (
          <View style={styles.planRow}>
            <Typography variant="caption" color="secondary">Expires</Typography>
            <Typography variant="bodySm">
              {new Date(plan.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>
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
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.xs },
});
