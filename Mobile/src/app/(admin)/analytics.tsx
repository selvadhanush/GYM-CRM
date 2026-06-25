import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';

const { width } = Dimensions.get('window');

const PIE_COLORS = [COLORS.primary, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load retention analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const statusData = data?.statusBreakdown?.map((s: any) => ({ name: s._id, value: s.count })) || [];
  const statusTotal = statusData.reduce((sum: number, s: any) => sum + s.value, 0);

  const churnTrend = data?.churnTrend || [];
  const maxChurnedValue = Math.max(...churnTrend.map((c: any) => c.churned || 0), 1);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Retention Analytics</Text>
          <Text style={styles.subtitle}>Churn metrics & lifetime value trends</Text>
        </View>

        {/* Telemetry Metric Cards */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Inactive */}
          <View style={[styles.metricCard, { borderLeftColor: '#F59E0B' }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Inactive (7d)</Text>
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.metricValue}>{data?.inactiveCount || 0}</Text>
            <Text style={styles.metricSub}>Active members with no attendance</Text>
          </View>

          {/* Card 2: Churn */}
          <View style={[styles.metricCard, { borderLeftColor: '#EF4444' }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Churn Rate (30d)</Text>
              <Ionicons name="trending-down-outline" size={16} color="#EF4444" />
            </View>
            <Text style={styles.metricValue}>{data?.churnRate || 0}%</Text>
            <Text style={styles.metricSub}>{data?.expiredLast30 || 0} expired this month</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {/* Card 3: Renewal */}
          <View style={[styles.metricCard, { borderLeftColor: COLORS.success }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Renewal Rate (90d)</Text>
              <Ionicons name="refresh-outline" size={16} color={COLORS.success} />
            </View>
            <Text style={styles.metricValue}>{data?.renewalRate || 0}%</Text>
            <Text style={styles.metricSub}>{data?.renewedCount || 0} members renewed</Text>
          </View>

          {/* Card 4: LTV */}
          <View style={[styles.metricCard, { borderLeftColor: '#8B5CF6' }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Avg Lifetime Value</Text>
              <Ionicons name="ribbon-outline" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.metricValue}>₹{(data?.avgLTV || 0).toLocaleString()}</Text>
            <Text style={styles.metricSub}>Average total paid per member</Text>
          </View>
        </View>

        {/* Churn Trend Bar Chart replacement */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📉 Monthly Churn Trend</Text>
          <View style={styles.barChartContainer}>
            {churnTrend.map((item: any, idx: number) => {
              const heightPct = (item.churned / maxChurnedValue) * 100;
              return (
                <View key={idx} style={styles.chartCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${heightPct}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{item.month}</Text>
                  <Text style={styles.barVal}>{item.churned}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Membership Status Distribution */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👥 Membership Status Ratio</Text>
          <View style={styles.ratioBarContainer}>
            {statusData.map((s: any, idx: number) => {
              const widthPct = statusTotal > 0 ? (s.value / statusTotal) * 100 : 0;
              if (widthPct === 0) return null;
              return (
                <View 
                  key={s.name} 
                  style={[
                    styles.ratioSegment, 
                    { 
                      width: `${widthPct}%`, 
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                      borderTopLeftRadius: idx === 0 ? 6 : 0,
                      borderBottomLeftRadius: idx === 0 ? 6 : 0,
                      borderTopRightRadius: idx === statusData.length - 1 ? 6 : 0,
                      borderBottomRightRadius: idx === statusData.length - 1 ? 6 : 0
                    }
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.ratioLegend}>
            {statusData.map((s: any, idx: number) => (
              <View key={s.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }]} />
                <Text style={styles.legendText}>{s.name} ({s.value})</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Value Members */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💎 Top Lifetime Value Members</Text>
          {data?.topMembers && data.topMembers.length > 0 ? (
            data.topMembers.map((m: any, i: number) => (
              <View key={m._id || i} style={styles.memberRankRow}>
                <View style={styles.memberRankLeft}>
                  <View style={[styles.rankBadge, { backgroundColor: `${PIE_COLORS[i % PIE_COLORS.length]}18` }]}>
                    <Text style={[styles.rankBadgeText, { color: PIE_COLORS[i % PIE_COLORS.length] }]}>#{i + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberPhone}>{m.phone}</Text>
                  </View>
                </View>
                <Text style={styles.memberValText}>₹{m.totalPaid.toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No payment history logged yet.</Text>
          )}
        </View>

        {/* Inactive Members table */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚠️ Inactive Members (7+ Days)</Text>
          <Text style={styles.sectionSubtitle}>Active plans but no attendance records recently</Text>
          {data?.inactiveMembers && data.inactiveMembers.length > 0 ? (
            data.inactiveMembers.map((m: any) => {
              const daysLeft = Math.ceil((new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <View key={m._id} style={styles.inactiveRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inactiveName}>{m.name}</Text>
                    <Text style={styles.inactiveDetail}>{m.phone} · {m.planId?.name || 'N/A'}</Text>
                  </View>
                  <View style={[styles.daysBadge, { backgroundColor: daysLeft < 7 ? 'rgba(239,68,68,0.1)' : 'rgba(255,122,0,0.1)' }]}>
                    <Text style={[styles.daysText, { color: daysLeft < 7 ? '#EF4444' : COLORS.primary }]}>
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.perfectState}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
              <Text style={styles.perfectStateText}>All active members attended recently!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: SPACING.md, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', gap: 12 },
  errorText: { fontSize: FONTS.sizes.sm, color: '#EF4444', textAlign: 'center', ...FONTS.medium },

  header: { marginBottom: SPACING.lg, marginTop: 40 },
  title: { fontSize: 24, ...FONTS.bold, color: '#000' },
  subtitle: { fontSize: FONTS.sizes.sm, color: '#666', marginTop: 2, ...FONTS.regular },

  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', borderLeftWidth: 5
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  metricLabel: { fontSize: 10, color: '#666', ...FONTS.bold, textTransform: 'uppercase' },
  metricValue: { fontSize: 20, ...FONTS.bold, color: '#000', marginVertical: 2 },
  metricSub: { fontSize: 9, color: '#888', ...FONTS.regular, lineHeight: 12 },

  sectionCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14
  },
  sectionTitle: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: '#000', marginBottom: 12 },
  sectionSubtitle: { fontSize: 11, color: '#666', ...FONTS.regular, marginTop: -8, marginBottom: 14 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, marginVertical: 12 },

  // Bar chart styles
  barChartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, marginTop: 10, paddingBottom: 10 },
  chartCol: { alignItems: 'center', width: 45 },
  barTrack: { width: 14, height: 100, backgroundColor: '#F3F4F6', borderRadius: 7, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { backgroundColor: '#EF4444', borderRadius: 7, width: '100%' },
  barLabel: { fontSize: 9, color: '#666', ...FONTS.bold, marginTop: 6 },
  barVal: { fontSize: 9, color: '#000', ...FONTS.bold, marginTop: 2 },

  // Ratio Segment styles
  ratioBarContainer: { height: 12, flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden', marginVertical: 8 },
  ratioSegment: { height: '100%' },
  ratioLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#666', ...FONTS.medium },

  // Member Rankings
  memberRankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  memberRankLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rankBadgeText: { fontSize: 11, ...FONTS.bold },
  memberName: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: '#000' },
  memberPhone: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 1 },
  memberValText: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: COLORS.success },

  // Inactive
  inactiveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  inactiveName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  inactiveDetail: { fontSize: 10, color: '#666', marginTop: 2, ...FONTS.regular },
  daysBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.md },
  daysText: { fontSize: 10, ...FONTS.bold },

  perfectState: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  perfectStateText: { fontSize: FONTS.sizes.xs, color: COLORS.success, ...FONTS.medium },
});
