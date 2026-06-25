import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useSessionStore } from '@/stores/session';
import { memberService } from '@/services/member';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { Skeleton } from '@/components/Skeleton';
import type { Member, Attendance } from '@/types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { active, sessionsRemaining, cooldownEndsAt, getRemainingSeconds, clear, hydrate } = useSessionStore();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [partnerGyms, setPartnerGyms] = useState<any[]>([]);
  const [lastVisitedGym, setLastVisitedGym] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const data = await memberService.getDashboardData();
      if (data) {
        setMember(data.member);
        setAttendance(data.attendance);
        setPartnerGyms(data.partnerGyms);
        setLastVisitedGym(data.lastVisitedGym || null);
        if (data.sessionStatus) {
          await useSessionStore.getState().applyStatus({
            ...data.sessionStatus,
            sessionsRemaining: data.member.sessionsRemaining || 0,
          });
        }
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hydrate();
      fetchData();
    }, [fetchData, hydrate])
  );

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const s = getRemainingSeconds();
      setTimerDisplay(`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`);
      if (s <= 0) clear();
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // FitPrime members are session-based; show sessions remaining instead of days left.
  const isFitPrimeMember = member?.planId?.gymId === 'SYSTEM';
  const daysRemaining = member?.expiryDate
    ? Math.max(0, Math.ceil((new Date(member.expiryDate).getTime() - Date.now()) / 86400000))
    : 0;
  const remainingSessions = sessionsRemaining ?? member?.sessionsRemaining ?? 0;

  const totalVisits = attendance.length;
  const balanceDue = member ? (member.planPrice || 0) - (member.paidAmount || 0) : 0;

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.content]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <View>
            <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
            <Skeleton width={200} height={28} />
          </View>
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>
        <Skeleton width="100%" height={160} borderRadius={24} style={{ marginBottom: 24 }} />
        <Skeleton width={150} height={24} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Skeleton width={80} height={80} borderRadius={16} />
          <Skeleton width={80} height={80} borderRadius={16} />
          <Skeleton width={80} height={80} borderRadius={16} />
          <Skeleton width={80} height={80} borderRadius={16} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getHour()} 👋</Text>
          <Text style={styles.userName}>{user?.name || 'Member'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'M').charAt(0).toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Active Session Banner -- no manual end button; sessions auto-expire. */}
      {active && (
        <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.sessionBanner}>
          <View style={styles.sessionLeft}>
            <View style={styles.sessionPulse}>
              <Ionicons name="fitness" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.sessionTitle}>Workout In Progress</Text>
              <Text style={styles.sessionSub}>{timerDisplay} remaining · auto-ends</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Cooldown Banner -- shown when the 3h post-session lock is active. */}
      {!active && cooldownEndsAt && new Date(cooldownEndsAt).getTime() > Date.now() && (
        <View style={[styles.sessionBanner, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
          <View style={styles.sessionLeft}>
            <View style={[styles.sessionPulse, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
              <Ionicons name="time" size={22} color={COLORS.warning} />
            </View>
            <View>
              <Text style={[styles.sessionTitle, { color: COLORS.warning }]}>Cooldown Active</Text>
              <Text style={[styles.sessionSub, { color: COLORS.warning }]}>
                Check in again after {new Date(cooldownEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Membership Hero Card */}
      <View style={styles.heroCard}>
        <LinearGradient
          colors={['rgba(255,122,0,0.15)', 'rgba(255,122,0,0.03)']}
          style={styles.heroGlow}
        />
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>CURRENT PLAN</Text>
            <Text style={styles.heroName}>{member?.planId?.name || 'No Active Plan'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: member?.status === 'Active' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
            <View style={[styles.statusDot, { backgroundColor: member?.status === 'Active' ? COLORS.success : COLORS.warning }]} />
            <Text style={[styles.statusLabel, { color: member?.status === 'Active' ? COLORS.success : COLORS.warning }]}>
              {member?.status || 'No Plan'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statVal}>{isFitPrimeMember ? remainingSessions : daysRemaining}</Text>
            <Text style={styles.statLbl}>{isFitPrimeMember ? 'Sessions Left' : 'Days Left'}</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statBlock}>
            <Text style={styles.statVal}>{totalVisits}</Text>
            <Text style={styles.statLbl}>Visits</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statBlock}>
            <Text style={styles.statVal}>₹{member?.paidAmount || 0}</Text>
            <Text style={styles.statLbl}>Paid</Text>
          </View>
        </View>

        {balanceDue > 0 && (
          <View style={styles.dueRow}>
            <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
            <Text style={styles.dueText}>₹{balanceDue} balance due</Text>
            <TouchableOpacity style={styles.payBtn} onPress={() => router.push('/(tabs)/packages')}>
              <Text style={styles.payBtnText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {isFitPrimeMember && member && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Session Utilization: {Math.max(0, (member.sessionsTotal || 0) - remainingSessions)} / {member.sessionsTotal || 0} Used
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(Math.max(0, (member.sessionsTotal || 0) - remainingSessions) / (member.sessionsTotal || 1) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={[COLORS.primary, '#FF9D43']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, ((member.sessionsTotal || 0) - remainingSessions) / (member.sessionsTotal || 1) * 100))}%`
                  }
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        {[
          { icon: 'qr-code', label: 'Scan QR', route: '/(tabs)/scanner', color: '#FF7A00', bg: 'rgba(255,122,0,0.12)' },
          { icon: 'calendar', label: 'Classes', route: '/(tabs)/classes', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
          { icon: 'pricetags', label: 'Plans', route: '/(tabs)/packages', color: '#00D4AA', bg: 'rgba(0,212,170,0.12)' },
          { icon: 'time', label: 'History', route: '/(tabs)/history', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
          { icon: 'person', label: 'Profile', route: '/(tabs)/profile', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.actionCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(item.route as any);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
            </View>
            <Text style={styles.actionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Last Visited Gym Quick Action */}
      {lastVisitedGym && (
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={styles.sectionTitle}>Check In Again</Text>
          <TouchableOpacity
            style={styles.reCheckInCard}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(tabs)/gym-details', params: { id: lastVisitedGym._id || lastVisitedGym.id } })}
          >
            <View style={styles.reCheckInHeader}>
              <View style={styles.reCheckInIconWrap}>
                <Ionicons name="barbell" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reCheckInTitle}>Train again at {lastVisitedGym.name}?</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={[styles.reCheckInSubtitle, { flex: 1 }]} numberOfLines={1}>
                    {lastVisitedGym.address || 'Address unavailable'}
                  </Text>
                  <View style={[
                    styles.gymOccupancyDot,
                    {
                      backgroundColor: 
                        (lastVisitedGym.activeSessions || 0) <= 5 ? '#22C55E' :
                        (lastVisitedGym.activeSessions || 0) <= 15 ? '#F59E0B' : '#EF4444'
                    }
                  ]} />
                </View>
              </View>
              <View style={styles.reCheckInGo}>
                <Ionicons name="chevron-forward" size={16} color="#FFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Partner Gyms List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Partnered Gyms</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gymsScroll} style={styles.gymsContainer}>
        {partnerGyms.length === 0 ? (
          <Text style={styles.emptySubtitle}>No partner gyms found</Text>
        ) : (
          partnerGyms.map((gym, i) => (
            <TouchableOpacity 
              key={gym._id || i} 
              style={styles.gymCard}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(tabs)/gym-details', params: { id: gym._id || gym.id } })}
            >
              {gym.images && gym.images.length > 0 ? (
                <Image source={{ uri: gym.images[0] }} style={styles.gymImageCover} />
              ) : (
                <View style={styles.gymIconWrap}>
                  <Ionicons name="barbell" size={24} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.gymCardContent}>
                <Text style={styles.gymName} numberOfLines={1}>{gym.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={[styles.gymAddress, { flex: 1 }]} numberOfLines={1}>
                    {gym.address || 'Location unavailable'}
                  </Text>
                  <View style={[
                    styles.gymOccupancyDot,
                    {
                      backgroundColor: 
                        (gym.activeSessions || 0) <= 5 ? '#22C55E' :
                        (gym.activeSessions || 0) <= 15 ? '#F59E0B' : '#EF4444'
                    }
                  ]} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Recent Check-ins */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Check-ins</Text>
        {attendance.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {attendance.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>No check-ins yet</Text>
          <Text style={styles.emptySubtitle}>Scan the QR code at your gym to check in</Text>
        </View>
      ) : (
        attendance.slice(0, 5).map((rec, i) => (
          <View key={rec._id || i} style={styles.checkInRow}>
            <View style={styles.checkInLeft}>
              <LinearGradient colors={['rgba(255,122,0,0.2)', 'rgba(255,122,0,0.05)']} style={styles.checkInIcon}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
              </LinearGradient>
              <View>
                <Text style={styles.checkInDate}>
                  {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </Text>
                <Text style={styles.checkInTime}>Checked in · {rec.checkInTime || 'N/A'}</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingTop: 56, paddingBottom: 110, paddingHorizontal: SPACING.lg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  greeting: { fontSize: FONTS.sizes.sm, color: '#666666', ...FONTS.medium, marginBottom: 2 },
  userName: { fontSize: FONTS.sizes.title, color: '#000000', ...FONTS.bold, letterSpacing: -0.5 },
  notifButton: {},
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,122,0,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,122,0,0.4)',
  },
  avatarText: { color: COLORS.primary, fontSize: FONTS.sizes.lg, ...FONTS.bold },

  sessionBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderRadius: RADIUS.xl, marginBottom: SPACING.md,
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sessionPulse: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  sessionTitle: { color: '#fff', fontSize: FONTS.sizes.md, ...FONTS.semibold },
  sessionSub: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.xs, ...FONTS.regular },
  endBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full },
  endBtnText: { color: '#fff', ...FONTS.semibold, fontSize: FONTS.sizes.sm },

  heroCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.xxl, padding: SPACING.lg,
    marginBottom: SPACING.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,122,0,0.15)',
  },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  heroLabel: { color: COLORS.primary, fontSize: FONTS.sizes.xs, ...FONTS.bold, letterSpacing: 1.5 },
  heroName: { color: '#000000', fontSize: FONTS.sizes.xxl, ...FONTS.bold, letterSpacing: -0.5, marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statBlock: { alignItems: 'center' },
  statVal: { color: '#000000', fontSize: FONTS.sizes.xl, ...FONTS.bold },
  statLbl: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular, marginTop: 2 },
  statSep: { width: 1, height: 32, backgroundColor: '#E5E7EB' },

  dueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.md,
    padding: SPACING.sm, marginTop: SPACING.md,
  },
  dueText: { flex: 1, color: COLORS.warning, fontSize: FONTS.sizes.sm, ...FONTS.medium },
  payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full },
  payBtnText: { color: '#fff', fontSize: FONTS.sizes.xs, ...FONTS.bold },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, color: '#000000', ...FONTS.bold, marginBottom: SPACING.md },
  seeAll: { color: COLORS.primary, fontSize: FONTS.sizes.sm, ...FONTS.medium },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  actionCard: {
    width: '31%', backgroundColor: '#F8F9FA', borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  actionLabel: { color: '#444444', fontSize: FONTS.sizes.xs, ...FONTS.medium },

  gymsContainer: { marginBottom: SPACING.lg, marginHorizontal: -SPACING.lg },
  gymsScroll: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  gymCard: {
    width: 140, backgroundColor: '#F8F9FA', borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden'
  },
  gymImageCover: {
    width: '100%', height: 90, backgroundColor: '#E5E7EB',
  },
  gymIconWrap: {
    width: '100%', height: 90, backgroundColor: 'rgba(255,122,0,0.12)',
    justifyContent: 'center', alignItems: 'center'
  },
  gymCardContent: {
    padding: SPACING.sm,
  },
  gymName: { color: '#000000', fontSize: FONTS.sizes.sm, ...FONTS.bold, marginBottom: 2 },
  gymAddress: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular },

  emptyCard: {
    backgroundColor: '#F8F9FA', borderRadius: RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.md },
  emptyTitle: { color: '#000000', fontSize: FONTS.sizes.lg, ...FONTS.semibold },
  emptySubtitle: { color: '#666666', fontSize: FONTS.sizes.sm, ...FONTS.regular, marginTop: 4, textAlign: 'center' },

  checkInRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F9FA', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#E5E7EB',
  },
  checkInLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  checkInIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  checkInDate: { color: '#000000', fontSize: FONTS.sizes.md, ...FONTS.semibold },
  checkInTime: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular, marginTop: 2 },

  // FitPrime advanced features styles
  progressContainer: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: 11, color: '#666666', ...FONTS.medium },
  progressPercent: { fontSize: 11, color: COLORS.primary, ...FONTS.bold },
  progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  reCheckInCard: {
    backgroundColor: '#F8F9FA', borderRadius: RADIUS.xl,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)',
  },
  reCheckInHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  reCheckInIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,122,0,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  reCheckInTitle: { color: '#000000', fontSize: FONTS.sizes.sm, ...FONTS.bold },
  reCheckInSubtitle: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular },
  reCheckInGo: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  gymOccupancyDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
});
