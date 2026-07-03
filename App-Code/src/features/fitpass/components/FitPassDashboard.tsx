import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { QrCode, Clock, Calendar, Zap, History } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useSessionStatus, useSessionHistory, usePartnerGyms } from '../api/fitpass.api';

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard() {
  const { data, isLoading } = useSessionStatus();

  const statusColor = useMemo(() => {
    if (!data) return theme.colors.textMuted;
    if (data.planStatus === 'Active') return theme.colors.success;
    if (data.planStatus === 'Expired') return theme.colors.error;
    return theme.colors.textMuted;
  }, [data]);

  const isLiveSession = data?.currentSessionEndsAt
    ? new Date(data.currentSessionEndsAt) > new Date()
    : false;

  if (isLoading) return <Skeleton style={styles.skeletonCard} />;

  return (
    <Card style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View>
          <Typography variant="caption" color="secondary">YOUR PASS</Typography>
          <Typography variant="h2" style={styles.planName}>
            {data?.planName ?? 'No Active Plan'}
          </Typography>
        </View>
        <Badge
          label={data?.planStatus ?? 'Unknown'}
          variant={data?.planStatus === 'Active' ? 'active' : 'expired'}
        />
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Typography variant="display" style={{ color: theme.colors.primary }}>
            {data?.sessionsRemaining ?? 0}
          </Typography>
          <Typography variant="caption" color="secondary">Sessions Left</Typography>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Typography variant="h1" style={{ color: theme.colors.text }}>
            {data?.sessionsTotal ?? 0}
          </Typography>
          <Typography variant="caption" color="secondary">Total Purchased</Typography>
        </View>
      </View>

      {data?.expiryDate && (
        <View style={styles.expiryRow}>
          <Calendar size={14} color={theme.colors.textSecondary} />
          <Typography variant="caption" color="secondary" style={styles.expiryText}>
            Expires {new Date(data.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Typography>
        </View>
      )}

      {isLiveSession && (
        <View style={styles.liveSessionBanner}>
          <Zap size={14} color={theme.colors.success} />
          <Typography variant="caption" style={{ color: theme.colors.success, marginLeft: theme.spacing.xs }}>
            Session Active — ends {new Date(data!.currentSessionEndsAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </View>
      )}

      {data?.cooldownEndsAt && !isLiveSession && new Date(data.cooldownEndsAt) > new Date() && (
        <View style={styles.cooldownBanner}>
          <Clock size={14} color={theme.colors.info} />
          <Typography variant="caption" style={{ color: theme.colors.info, marginLeft: theme.spacing.xs }}>
            Cooldown until {new Date(data.cooldownEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </View>
      )}
    </Card>
  );
}

// ─── Recent History ────────────────────────────────────────────────────────────
function RecentHistory() {
  const { data, isLoading } = useSessionHistory(1);

  if (isLoading) return <Skeleton style={styles.skeletonCard} />;

  const items = data?.data ?? [];
  if (items.length === 0) {
    return <EmptyState title="No History" description="No check-in history yet." />;
  }

  return (
    <View>
      {items.slice(0, 5).map((item) => (
        <Card key={item.id} style={styles.historyItem}>
          <View style={styles.historyRow}>
            <View style={{ flex: 1 }}>
              <Typography variant="bodySm">{item.gymName}</Typography>
              {item.branchName && (
                <Typography variant="caption" color="secondary">{item.branchName}</Typography>
              )}
            </View>
            <View style={styles.historyRight}>
              <Badge
                label={item.status}
                variant={item.status === 'Completed' ? 'success' : item.status === 'Active' ? 'info' : 'expired'}
              />
              <Typography variant="caption" color="muted" style={{ marginTop: theme.spacing.xs }}>
                {new Date(item.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Typography>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

// ─── Partner Gyms ─────────────────────────────────────────────────────────────
function PartnerGymCount() {
  const { data, isLoading } = usePartnerGyms();
  if (isLoading) return <Skeleton style={{ height: 60, borderRadius: theme.radii.md }} />;
  const count = Array.isArray(data) ? data.length : 0;
  return (
    <Card style={styles.partnerCard}>
      <Typography variant="h1" style={{ color: theme.colors.primary }}>{count}</Typography>
      <Typography variant="caption" color="secondary">Partner Gyms Available</Typography>
    </Card>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export function FitPassDashboard({ onScanQR }: { onScanQR: () => void }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Typography variant="h1" style={styles.sectionTitle}>My FitPass</Typography>

      <SessionCard />

      <TouchableOpacity
        style={styles.qrButton}
        activeOpacity={0.85}
        onPress={onScanQR}
        accessibilityLabel="Scan QR to Check In"
      >
        <QrCode size={22} color={theme.colors.background} />
        <Typography variant="bodySm" style={styles.qrButtonText}>Scan QR to Check In</Typography>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <History size={16} color={theme.colors.textSecondary} />
          <Typography variant="h3" style={styles.sectionLabel}>Recent Check-ins</Typography>
        </View>
        <RecentHistory />
      </View>

      <View style={styles.section}>
        <PartnerGymCount />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  sessionCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  expiryText: {
    marginLeft: theme.spacing.xs,
  },
  liveSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  cooldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 118, 210, 0.12)',
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    minHeight: 48,
  },
  qrButtonText: {
    color: theme.colors.background,
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.text,
  },
  historyItem: {
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  partnerCard: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  skeletonCard: {
    height: 160,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
  },
});
