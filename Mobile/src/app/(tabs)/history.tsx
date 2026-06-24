import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memberService } from '@/services/member';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import type { Attendance, Payment } from '@/types';

type HistoryTab = 'attendance' | 'payments';

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('attendance');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [a, p] = await Promise.all([
        memberService.getMyAttendance(),
        memberService.getMyPayments(),
      ]);
      setAttendance(a); setPayments(p);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  if (loading) return (
    <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Activity</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <LinearGradient colors={['rgba(255,122,0,0.15)', 'rgba(255,122,0,0.03)']} style={styles.statGrad}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.statVal}>{attendance.length}</Text>
            <Text style={styles.statLbl}>Total Visits</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient colors={['rgba(0,212,170,0.15)', 'rgba(0,212,170,0.03)']} style={styles.statGrad}>
            <Ionicons name="card" size={20} color={COLORS.secondary} />
            <Text style={[styles.statVal, { color: COLORS.secondary }]}>₹{totalPaid}</Text>
            <Text style={styles.statLbl}>Total Paid</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {([
          { id: 'attendance', icon: 'calendar', label: `Check-ins (${attendance.length})` },
          { id: 'payments', icon: 'receipt', label: `Payments (${payments.length})` },
        ] as { id: HistoryTab; icon: any; label: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.id ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Attendance List */}
      {activeTab === 'attendance' && (
        attendance.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Check-ins Yet</Text>
            <Text style={styles.emptySub}>Scan the QR code at your gym to check in</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {attendance.map((rec, i) => {
              const d = new Date(rec.date);
              return (
                <View key={rec._id || i} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateDay}>{d.getDate()}</Text>
                      <Text style={styles.dateMon}>{d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.cardMid}>
                    <Text style={styles.cardTitle}>{d.toLocaleDateString('en-IN', { weekday: 'long' })}</Text>
                    <Text style={styles.cardSub}>Checked in at {rec.checkInTime || 'N/A'}</Text>
                  </View>
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={14} color={COLORS.success} />
                  </View>
                </View>
              );
            })}
          </View>
        )
      )}

      {/* Payments List */}
      {activeTab === 'payments' && (
        payments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No Payments Yet</Text>
            <Text style={styles.emptySub}>Your payment history will appear here</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {payments.map((pay, i) => {
              const d = new Date(pay.date);
              return (
                <View key={pay._id || i} style={styles.card}>
                  <View style={styles.amountBox}>
                    <Text style={styles.amountSymbol}>₹</Text>
                    <Text style={styles.amountVal}>{pay.amount}</Text>
                  </View>
                  <View style={styles.cardMid}>
                    <Text style={styles.cardTitle}>{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    <Text style={styles.cardSub}>{pay.method}</Text>
                    {pay.transactionId ? (
                      <Text style={styles.txId} numberOfLines={1}>ID: {pay.transactionId.slice(0, 20)}</Text>
                    ) : null}
                  </View>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>Paid</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: 110 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },

  pageTitle: { fontSize: FONTS.sizes.title, color: '#000000', ...FONTS.bold, letterSpacing: -0.5, marginBottom: SPACING.lg },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  statGrad: { padding: SPACING.md, alignItems: 'center', gap: 4 },
  statVal: { color: '#000000', fontSize: FONTS.sizes.xl, ...FONTS.bold },
  statLbl: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.xl, padding: 4, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.lg },
  activeTab: { backgroundColor: 'rgba(255,122,0,0.12)' },
  tabText: { color: '#666666', fontSize: FONTS.sizes.sm, ...FONTS.medium },
  activeTabText: { color: COLORS.primary },

  empty: {
    backgroundColor: '#F8F9FA', borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.md },
  emptyTitle: { color: '#000000', fontSize: FONTS.sizes.lg, ...FONTS.semibold },
  emptySub: { color: '#666666', fontSize: FONTS.sizes.sm, ...FONTS.regular, marginTop: 4, textAlign: 'center' },

  list: { gap: SPACING.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: '#F8F9FA', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardLeft: {},
  dateBox: {
    width: 48, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,122,0,0.1)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)',
  },
  dateDay: { color: COLORS.primary, fontSize: FONTS.sizes.lg, ...FONTS.bold, lineHeight: 20 },
  dateMon: { color: COLORS.primary, fontSize: 9, ...FONTS.bold, letterSpacing: 0.5 },
  cardMid: { flex: 1 },
  cardTitle: { color: '#000000', fontSize: FONTS.sizes.md, ...FONTS.semibold },
  cardSub: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular, marginTop: 2 },
  txId: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.regular, marginTop: 2 },

  checkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(34,197,94,0.12)', justifyContent: 'center', alignItems: 'center' },

  amountBox: { width: 56, alignItems: 'center', justifyContent: 'center' },
  amountSymbol: { color: COLORS.secondary, fontSize: FONTS.sizes.xs, ...FONTS.bold },
  amountVal: { color: COLORS.secondary, fontSize: FONTS.sizes.lg, ...FONTS.bold },
  paidBadge: { backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  paidText: { color: COLORS.success, fontSize: FONTS.sizes.xs, ...FONTS.bold },
});
