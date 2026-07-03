import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { CalendarCheck, CreditCard, Activity, TrendingUp } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge, Skeleton } from '@/components/ui';
import { useH4Dashboard, useH4Plan } from '../api/h4.api';
import { useAuth } from '@/features/auth';

// ─── Membership Card ──────────────────────────────────────────────────────────
function MembershipCard() {
  const { data: plan, isLoading } = useH4Plan();
  const user = useAuth((s) => s.user);

  if (isLoading) return <Skeleton style={styles.skeletonCard} />;

  const statusColor = plan?.status === 'Active' ? theme.colors.success : theme.colors.error;

  return (
    <Card style={styles.membershipCard}>
      {/* Decorative accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.membershipHeader}>
        <View>
          <Typography variant="caption" color="secondary">H4 MEMBER</Typography>
          <Typography variant="h2" style={styles.memberName}>{user?.name ?? '—'}</Typography>
        </View>
        <Badge label={plan?.status ?? 'Unknown'} variant={plan?.status === 'Active' ? 'active' : 'expired'} />
      </View>

      <View style={styles.planDetails}>
        <View style={styles.planRow}>
          <Typography variant="caption" color="secondary">Plan</Typography>
          <Typography variant="bodySm">{plan?.planName ?? 'No Plan'}</Typography>
        </View>
        {plan?.expiryDate && (
          <View style={styles.planRow}>
            <Typography variant="caption" color="secondary">Expires</Typography>
            <Typography variant="bodySm">
              {new Date(plan.expiryDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Typography>
          </View>
        )}
      </View>
    </Card>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────
function StatsRow() {
  const { data, isLoading } = useH4Dashboard();

  if (isLoading) {
    return (
      <View style={styles.statsRow}>
        <Skeleton style={styles.statCardSkeleton} />
        <Skeleton style={styles.statCardSkeleton} />
      </View>
    );
  }

  const attendanceThisMonth = data?.attendanceCount ?? 0;
  const recentPayment = data?.recentPayments?.[0];

  return (
    <View style={styles.statsRow}>
      <Card style={styles.statCard}>
        <Activity size={20} color={theme.colors.success} />
        <Typography variant="h1" style={{ color: theme.colors.text }}>{attendanceThisMonth}</Typography>
        <Typography variant="caption" color="secondary">Visits This Month</Typography>
      </Card>
      <Card style={styles.statCard}>
        <CreditCard size={20} color={theme.colors.primary} />
        <Typography variant="h1" style={{ color: theme.colors.text }}>
          {recentPayment ? `₹${recentPayment.amount}` : '—'}
        </Typography>
        <Typography variant="caption" color="secondary">Last Payment</Typography>
      </Card>
    </View>
  );
}

// ─── Recent Attendance ────────────────────────────────────────────────────────
function RecentAttendance() {
  const { data, isLoading } = useH4Dashboard();

  if (isLoading) return <Skeleton style={styles.skeletonCard} />;

  const records = data?.recentAttendance ?? [];
  if (records.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Typography variant="bodySm" color="secondary">No attendance records this month.</Typography>
      </Card>
    );
  }

  return (
    <View>
      {records.slice(0, 5).map((rec) => (
        <Card key={rec.id} style={styles.attendanceRow}>
          <View style={styles.attendanceDot} />
          <View>
            <Typography variant="bodySm">
              {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Typography>
            <Typography variant="caption" color="secondary">{rec.checkInTime}</Typography>
          </View>
        </Card>
      ))}
    </View>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export function H4Dashboard() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Typography variant="h1" style={styles.sectionTitle}>H4 Fitness</Typography>

      <MembershipCard />
      <StatsRow />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CalendarCheck size={16} color={theme.colors.textSecondary} />
          <Typography variant="h3" style={styles.sectionLabel}>Recent Attendance</Typography>
        </View>
        <RecentAttendance />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  sectionTitle: { color: theme.colors.text, marginBottom: theme.spacing.md },
  membershipCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.success,
    borderTopLeftRadius: theme.radii.md,
    borderTopRightRadius: theme.radii.md,
  },
  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  memberName: { color: theme.colors.text, marginTop: theme.spacing.xs },
  planDetails: { gap: theme.spacing.sm },
  planRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statCardSkeleton: { flex: 1, height: 100, borderRadius: theme.radii.md },
  section: { marginBottom: theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.sm },
  sectionLabel: { color: theme.colors.text },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  attendanceDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.success,
  },
  emptyCard: { padding: theme.spacing.md, alignItems: 'center' },
  skeletonCard: { height: 160, borderRadius: theme.radii.md, marginBottom: theme.spacing.md },
});
