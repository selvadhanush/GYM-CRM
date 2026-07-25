import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  CalendarCheck, 
  CreditCard, 
  Dumbbell, 
  Utensils, 
  Crown, 
  ChevronRight, 
  Activity,
  Clock,
  Sparkles,
  User
} from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Badge, Skeleton } from '@/components/ui';
import { useH4Dashboard, useH4Plan } from '../api/h4.api';
import { useAuth } from '@/features/auth';

// ─── Header Section ────────────────────────────────────────────────────────────
function DashboardHeader() {
  const user = useAuth((s) => s.user);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <View style={styles.avatarCircle}>
          {user?.name ? (
            <Typography variant="h3" style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Typography>
          ) : (
            <User size={20} color={theme.colors.primary} />
          )}
        </View>
        <View style={styles.headerTextGroup}>
          <Typography variant="caption" color="secondary" style={styles.subGreeting}>
            WELCOME BACK
          </Typography>
          <Typography variant="h2" style={styles.userName}>
            {user?.name ?? 'Member'}
          </Typography>
        </View>
      </View>
      <View style={styles.vipBadgeContainer}>
        <Crown size={14} color={theme.colors.primary} />
        <Typography variant="caption" style={styles.vipText}>
          H4 CLUB
        </Typography>
      </View>
    </View>
  );
}

// ─── Luxury H4 Membership Pass ───────────────────────────────────────────────
function MembershipCard() {
  const { data: plan, isLoading } = useH4Plan();
  const user = useAuth((s) => s.user);

  if (isLoading) return <Skeleton style={styles.skeletonCard} />;

  const isActive = plan?.status === 'Active';
  const expiryFormatted = plan?.expiryDate
    ? new Date(plan.expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'No Expiry';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardBrandRow}>
          <Sparkles size={16} color={theme.colors.primary} />
          <Typography variant="caption" style={styles.cardBrandTitle}>
            H4 FITNESS PASS
          </Typography>
        </View>
        <Badge
          label={plan?.status ?? 'Active'}
          variant={isActive ? 'active' : 'expired'}
        />
      </View>

      <View style={styles.cardBody}>
        <Typography variant="h1" style={styles.cardMemberName}>
          {user?.name ?? 'Valued Member'}
        </Typography>

        <View style={styles.cardDetailsGrid}>
          <View style={styles.cardDetailCol}>
            <Typography variant="caption" color="secondary" style={styles.detailLabel}>
              CURRENT PLAN
            </Typography>
            <Typography variant="bodySm" style={styles.detailValue}>
              {plan?.planName ?? 'Standard H4 Membership'}
            </Typography>
          </View>

          <View style={styles.cardDetailColRight}>
            <Typography variant="caption" color="secondary" style={styles.detailLabel}>
              VALID UNTIL
            </Typography>
            <Typography variant="bodySm" style={styles.detailValue}>
              {expiryFormatted}
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Typography variant="caption" color="muted" style={styles.memberIdText}>
          ID: {user?.id ? `H4-${user.id.slice(-6).toUpperCase()}` : 'H4-MEMBER'}
        </Typography>
        <View style={styles.accessIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? theme.colors.success : theme.colors.error }]} />
          <Typography variant="caption" style={{ color: isActive ? theme.colors.success : theme.colors.textMuted, fontWeight: '600', fontSize: 11 }}>
            {isActive ? 'PASS VERIFIED' : 'PASS INACTIVE'}
          </Typography>
        </View>
      </View>
    </View>
  );
}

// ─── Quick Shortcuts Navigation ──────────────────────────────────────────────
function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      id: 'workouts',
      title: 'Workouts',
      subtitle: 'Daily Routines',
      icon: Dumbbell,
      route: '/(h4)/workouts',
      iconBg: 'rgba(240, 160, 32, 0.12)',
      iconColor: theme.colors.primary,
    },
    {
      id: 'diets',
      title: 'Diet Plan',
      subtitle: 'Nutrition Guide',
      icon: Utensils,
      route: '/(h4)/diets',
      iconBg: 'rgba(46, 125, 50, 0.12)',
      iconColor: theme.colors.success,
    },
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: 'Check-in Logs',
      icon: CalendarCheck,
      route: '/(h4)/attendance',
      iconBg: 'rgba(25, 118, 210, 0.12)',
      iconColor: theme.colors.info,
    },
    {
      id: 'payments',
      title: 'Payments',
      subtitle: 'Invoices & History',
      icon: CreditCard,
      route: '/(h4)/payments',
      iconBg: 'rgba(156, 39, 176, 0.12)',
      iconColor: '#ab47bc',
    },
  ];

  return (
    <View style={styles.quickActionsContainer}>
      <Typography variant="h3" style={styles.sectionHeaderTitle}>
        Quick Access
      </Typography>
      <View style={styles.actionsGrid}>
        {actions.map((item) => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.actionTile}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: item.iconBg }]}>
                <IconComp size={20} color={item.iconColor} />
              </View>
              <View style={styles.actionTileContent}>
                <Typography variant="bodySm" style={styles.actionTitle}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="secondary" style={styles.actionSubtitle}>
                  {item.subtitle}
                </Typography>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Stats Overview Cards ───────────────────────────────────────────────────
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
      <View style={styles.statTile}>
        <View style={styles.statHeaderRow}>
          <Activity size={18} color={theme.colors.success} />
          <Badge label="This Month" variant="info" />
        </View>
        <Typography variant="h1" style={styles.statValue}>
          {attendanceThisMonth}
        </Typography>
        <Typography variant="caption" color="secondary">
          Gym Visits Completed
        </Typography>
      </View>

      <View style={styles.statTile}>
        <View style={styles.statHeaderRow}>
          <CreditCard size={18} color={theme.colors.primary} />
          <Typography variant="caption" color="muted">Last Paid</Typography>
        </View>
        <Typography variant="h1" style={styles.statValue}>
          {recentPayment ? `₹${recentPayment.amount}` : '—'}
        </Typography>
        <Typography variant="caption" color="secondary">
          Latest Payment
        </Typography>
      </View>
    </View>
  );
}

// ─── Recent Attendance Activity ──────────────────────────────────────────────
function RecentAttendance() {
  const { data, isLoading } = useH4Dashboard();
  const router = useRouter();

  if (isLoading) return <Skeleton style={styles.skeletonCard} />;

  const records = data?.recentAttendance ?? [];

  return (
    <View style={styles.activitySection}>
      <View style={styles.activityHeader}>
        <View style={styles.activityTitleGroup}>
          <Clock size={16} color={theme.colors.primary} />
          <Typography variant="h3" style={styles.activityTitle}>
            Recent Attendance
          </Typography>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(h4)/attendance')}
          style={styles.viewAllBtn}
          activeOpacity={0.7}
        >
          <Typography variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            View All
          </Typography>
          <ChevronRight size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="bodySm" color="secondary">
            No check-in records logged this month.
          </Typography>
        </View>
      ) : (
        <View style={styles.recordsList}>
          {records.slice(0, 4).map((rec) => (
            <View key={rec.id} style={styles.recordRow}>
              <View style={styles.recordLeft}>
                <View style={styles.greenPulseDot} />
                <View>
                  <Typography variant="bodySm" style={styles.recordDateText}>
                    {new Date(rec.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    H4 Main Center
                  </Typography>
                </View>
              </View>
              <View style={styles.timeBadge}>
                <Typography variant="caption" style={styles.timeText}>
                  {rec.checkInTime}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main H4 Dashboard Component ─────────────────────────────────────────────
export function H4Dashboard() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHeader />
      <MembershipCard />
      <QuickActions />
      <StatsRow />
      <RecentAttendance />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20, // Clean, comfortable horizontal padding on both sides
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
    gap: theme.spacing.lg,
  },

  // Header styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(240, 160, 32, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(240, 160, 32, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  headerTextGroup: {
    gap: 2,
  },
  subGreeting: {
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: '600',
  },
  userName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  vipBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(240, 160, 32, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(240, 160, 32, 0.25)',
  },
  vipText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Card styles (No sharp side accent bars or harsh lines)
  cardContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardBrandTitle: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  cardBody: {
    gap: theme.spacing.md,
  },
  cardMemberName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  cardDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.bgTertiary,
    padding: theme.spacing.md,
    borderRadius: 14,
  },
  cardDetailCol: {
    gap: 2,
  },
  cardDetailColRight: {
    gap: 2,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.xs,
  },
  memberIdText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  accessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Quick Actions Grid
  quickActionsContainer: {
    gap: theme.spacing.sm,
  },
  sectionHeaderTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionTile: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileContent: {
    flex: 1,
  },
  actionTitle: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  actionSubtitle: {
    fontSize: 11,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statTile: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  statCardSkeleton: {
    flex: 1,
    height: 100,
    borderRadius: 16,
  },

  // Recent attendance
  activitySection: {
    gap: theme.spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  emptyContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recordsList: {
    gap: theme.spacing.xs,
  },
  recordRow: {
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  recordDateText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  timeBadge: {
    backgroundColor: theme.colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  skeletonCard: {
    height: 160,
    borderRadius: 20,
  },
});
