import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';
import { memberService } from '@/services/member';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import type { Member } from '@/types';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const d = await memberService.getMyPlan();
      setMember(d);
    } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: logout },
  ]);

  const daysRemaining = member?.expiryDate
    ? Math.max(0, Math.ceil((new Date(member.expiryDate).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <LinearGradient
          colors={['rgba(255,122,0,0.25)', 'rgba(255,122,0,0.05)', 'transparent']}
          style={styles.heroBg}
        />
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || 'M').charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        <Text style={styles.profileName}>{user?.name || 'Member'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={13} color={COLORS.primary} />
          <Text style={styles.roleText}>Member</Text>
        </View>
      </View>

      {/* Stats Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.stripStat}>
          <Text style={styles.stripVal}>{daysRemaining}</Text>
          <Text style={styles.stripLbl}>Days Left</Text>
        </View>
        <View style={styles.stripSep} />
        <View style={styles.stripStat}>
          <Text style={styles.stripVal}>{member?.status || '—'}</Text>
          <Text style={styles.stripLbl}>Status</Text>
        </View>
        <View style={styles.stripSep} />
        <View style={styles.stripStat}>
          <Text style={styles.stripVal}>₹{member?.paidAmount || 0}</Text>
          <Text style={styles.stripLbl}>Paid</Text>
        </View>
      </View>

      {/* Info Card */}
      <Text style={styles.sectionTitle}>Account Details</Text>
      <View style={styles.infoCard}>
        {[
          { icon: 'person-outline', label: 'Full Name', value: member?.name || user?.name || 'N/A' },
          { icon: 'mail-outline', label: 'Email', value: member?.email || user?.email || 'N/A' },
          { icon: 'call-outline', label: 'Phone', value: member?.phone || user?.phone || 'Not set' },
          {
            icon: 'calendar-outline', label: 'Member Since',
            value: user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'N/A',
          },
        ].map((item, i, arr) => (
          <View key={item.label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
            <View style={styles.infoIconWrap}>
              <Ionicons name={item.icon as any} size={17} color={COLORS.primary} />
            </View>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Membership Card */}
      <Text style={styles.sectionTitle}>Membership</Text>
      <View style={styles.infoCard}>
        {[
          { icon: 'barbell-outline', label: 'Plan', value: member?.planId?.name || 'No plan yet' },
          {
            icon: 'log-in-outline', label: 'Joined',
            value: member?.joinDate
              ? new Date(member.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'N/A',
          },
          {
            icon: 'hourglass-outline', label: 'Expires',
            value: member?.expiryDate
              ? new Date(member.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'No active plan',
          },
        ].map((item, i, arr) => (
          <View key={item.label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
            <View style={styles.infoIconWrap}>
              <Ionicons name={item.icon as any} size={17} color={COLORS.secondary} />
            </View>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Freeze History */}
      {member?.freezeHistory && member.freezeHistory.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Freeze History</Text>
          {member.freezeHistory.map((f, i) => (
            <View key={i} style={styles.freezeRow}>
              <View style={styles.freezeIcon}>
                <Ionicons name="snow" size={16} color="#60A5FA" />
              </View>
              <View>
                <Text style={styles.freezeDate}>
                  {new Date(f.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(f.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
                {f.reason ? <Text style={styles.freezeReason}>{f.reason}</Text> : null}
              </View>
            </View>
          ))}
        </>
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingTop: 0, paddingBottom: 110, paddingHorizontal: SPACING.lg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },

  heroHeader: {
    alignItems: 'center', paddingTop: 64, paddingBottom: SPACING.xl,
    marginHorizontal: -SPACING.lg, marginBottom: SPACING.lg, overflow: 'hidden', position: 'relative',
  },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  avatarText: { fontSize: FONTS.sizes.hero, color: '#fff', ...FONTS.bold },
  profileName: { fontSize: FONTS.sizes.xxl, color: '#000000', ...FONTS.bold, letterSpacing: -0.5 },
  profileEmail: { fontSize: FONTS.sizes.sm, color: '#666666', ...FONTS.regular, marginTop: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,122,0,0.12)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, marginTop: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)',
  },
  roleText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, ...FONTS.semibold },

  statsStrip: {
    flexDirection: 'row', backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  stripStat: { flex: 1, alignItems: 'center' },
  stripVal: { color: '#000000', fontSize: FONTS.sizes.xl, ...FONTS.bold },
  stripLbl: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular, marginTop: 2 },
  stripSep: { width: 1, backgroundColor: '#E5E7EB' },

  sectionTitle: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.bold, letterSpacing: 1.5, marginBottom: SPACING.sm },

  infoCard: {
    backgroundColor: '#F8F9FA', borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 14, gap: SPACING.sm },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,122,0,0.08)', justifyContent: 'center', alignItems: 'center',
  },
  infoLabel: { color: '#666666', fontSize: FONTS.sizes.sm, ...FONTS.regular, width: 90 },
  infoValue: { flex: 1, color: '#000000', fontSize: FONTS.sizes.sm, ...FONTS.semibold, textAlign: 'right' },

  freezeRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: '#F8F9FA', borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#E5E7EB',
  },
  freezeIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(96,165,250,0.1)', justifyContent: 'center', alignItems: 'center' },
  freezeDate: { color: '#000000', fontSize: FONTS.sizes.sm, ...FONTS.medium },
  freezeReason: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.08)', padding: SPACING.md, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginBottom: SPACING.xxl,
  },
  logoutText: { color: COLORS.danger, fontSize: FONTS.sizes.md, ...FONTS.semibold },
});
