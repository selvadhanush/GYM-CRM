import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { 
  Users, CheckCircle, AlertTriangle, Clock, Sparkles, DollarSign, 
  ArrowDown, ArrowUp, Zap, Ticket, Activity, TrendingUp, Search, MapPin, Calendar 
} from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { useGlobalStats } from '../api/superadmin.api';
import { Card, Skeleton, Typography, Button, Input, Badge } from '@/components/ui';
import { BranchSelector } from './BranchSelector';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { API_CLIENT } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

const { width } = Dimensions.get('window');

interface KpiData {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subText?: string;
  extraInfo?: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const activeDivision = useAuth((state) => state.activeDivision);
  const selectedBranchId = useAuth((state) => state.selectedBranchId);
  const selectedGymId = useAuth((state) => state.selectedGymId);
  const isFitPass = activeDivision === 'fitpass';

  // State for FitPass drill-down
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');
  const [selectedMemberSummary, setSelectedMemberSummary] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // 1. Query H4 Global Stats
  const { data: stats, isLoading: isH4Loading } = useGlobalStats(selectedBranchId, selectedGymId);

  // 2. Query FitPass Analytics
  const { data: fitpassData, isLoading: isFitpassLoading } = useQuery<any>({
    queryKey: ['fitpass-analytics-stats'],
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/sessions/analytics');
      return data.analytics || {};
    },
    enabled: isFitPass,
  });

  // 3. Query Members List for Search
  const { data: searchResults, isLoading: isSearching } = useQuery<any[]>({
    queryKey: ['fitpass-search-members', searchTrigger],
    queryFn: async () => {
      if (!searchTrigger) return [];
      const { data } = await API_CLIENT.get(`/members?search=${searchTrigger}`);
      return data || [];
    },
    enabled: isFitPass && !!searchTrigger,
  });

  const selectMember = async (memberId: string) => {
    setLoadingSummary(true);
    try {
      const { data } = await API_CLIENT.get(`/sessions/member-summary/${memberId}`);
      setSelectedMemberSummary(data.summary);
    } catch (err: any) {
      Alert.alert('Details Error', err.response?.data?.message || 'Could not load member summary. Ensure this member has a FitPass plan.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    setSearchTrigger(searchQuery);
  };

  const formatTrendData = (trend: any) => {
    if (!trend || trend.length === 0) return { labels: ['None'], data: [0] };
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = trend.map((item: any) => monthNames[item._id.month - 1]);
    const data = trend.map((item: any) => item.total);
    return { labels, data };
  };

  const formatPlanData = (plans: any) => {
    if (!plans || plans.length === 0) return { labels: ['None'], data: [0] };
    const labels = plans.map((item: any) => item._id || 'Global');
    const data = plans.map((item: any) => item.value);
    return { labels, data };
  };

  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(212, 255, 0, ${opacity})`,
    labelColor: () => theme.colors.textSecondary,
    style: {
      borderRadius: theme.radii.lg,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  // ----------------------------------------------------
  // FITPASS PORTAL VIEW RENDER
  // ----------------------------------------------------
  if (isFitPass) {
    if (isFitpassLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Skeleton height={60} style={{ marginBottom: theme.spacing.md }} />
          <View style={styles.grid}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <View key={idx} style={styles.gridItemSkeleton}>
                <Skeleton height={110} />
              </View>
            ))}
          </View>
          <Skeleton height={200} style={{ marginTop: theme.spacing.lg }} />
        </View>
      );
    }

    const fitpassKpis: KpiData[] = [
      {
        title: 'FitPass Subscribers',
        value: fitpassData?.totalFitPassMembers || 0,
        icon: <Users size={20} color={theme.colors.primary} />,
        color: theme.colors.primary,
        bgColor: theme.colors.brandLight,
        subText: `${fitpassData?.activeFitPassMembers || 0} Active · ${fitpassData?.expiredFitPassMembers || 0} Expired`,
      },
      {
        title: 'Total Sessions Sold',
        value: fitpassData?.totalSessionsSold || 0,
        icon: <Ticket size={20} color="#3b82f6" />,
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        subText: `🎟️ ${fitpassData?.remainingSessions || 0} remaining in network`,
      },
      {
        title: 'Sessions Consumed',
        value: fitpassData?.totalSessionsUsed || 0,
        icon: <Activity size={20} color={theme.colors.success} />,
        color: theme.colors.success,
        bgColor: 'rgba(0, 255, 102, 0.1)',
        subText: `🔥 ${fitpassData?.totalSessionsSold ? ((fitpassData.totalSessionsUsed / fitpassData.totalSessionsSold) * 100).toFixed(1) : 0}% utilization`,
      },
      {
        title: 'Avg Visits / User',
        value: fitpassData?.avgVisitsPerMember || 0,
        icon: <TrendingUp size={20} color={theme.colors.info} />,
        color: theme.colors.info,
        bgColor: 'rgba(0, 255, 255, 0.1)',
        subText: '📈 Average check-ins per user',
      },
    ];

    return (
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Widget */}
        <Card style={styles.fitpassHeaderCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Zap size={24} color={theme.colors.primary} />
            <Typography variant="h2" style={{ fontWeight: '800' }}>FitPass Universal Reports</Typography>
          </View>
          <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>
            Monitor subscriber counts, check-ins, remaining session credits, and partner check-in histories.
          </Typography>
        </Card>

        {/* KPIs Grid */}
        <View style={styles.grid}>
          {fitpassKpis.map((kpi, idx) => (
            <View key={idx} style={styles.gridItem}>
              <Card accentColor={kpi.color} style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Typography variant="caption" color="secondary" style={styles.kpiTitle} numberOfLines={1}>
                    {kpi.title}
                  </Typography>
                  <View style={[styles.kpiIconWrapper, { backgroundColor: kpi.bgColor }]}>
                    {kpi.icon}
                  </View>
                </View>
                <View>
                  <Typography variant="h2" style={styles.kpiValue} numberOfLines={1}>
                    {kpi.value}
                  </Typography>
                  {kpi.subText && (
                    <Typography variant="caption" color="muted" style={{ fontSize: 9, marginTop: 2 }} numberOfLines={1}>
                      {kpi.subText}
                    </Typography>
                  )}
                </View>
              </Card>
            </View>
          ))}
        </View>

        {/* Member Drill-down search */}
        <Card style={styles.sectionCard}>
          <Typography variant="body" style={styles.sectionTitle}>
            <Search size={16} /> Member FitPass Drill-down
          </Typography>
          <Typography variant="caption" color="secondary" style={{ marginBottom: theme.spacing.md }}>
            Search member profile to inspect their active sessions and checkout logs.
          </Typography>

          <View style={styles.searchRow}>
            <Input 
              label=""
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1 }}
            />
            <Button 
              title="Search"
              loading={isSearching}
              onPress={handleSearchSubmit}
              style={styles.searchBtn}
            />
          </View>

          {/* Search results list */}
          {searchResults && searchResults.length > 0 && (
            <View style={styles.resultsList}>
              {searchResults.map((member: any) => (
                <TouchableOpacity 
                  key={member._id} 
                  onPress={() => selectMember(member._id)}
                  style={styles.memberResultRow}
                >
                  <View>
                    <Typography variant="bodySm" style={{ fontWeight: '700' }}>{member.name}</Typography>
                    <Typography variant="caption" color="secondary">📞 {member.phone}</Typography>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Individual account details summary card */}
          {loadingSummary ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: theme.spacing.md }} />
          ) : selectedMemberSummary ? (
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Typography variant="bodySm" style={{ fontWeight: '800' }}>💳 FitPass Account Detail</Typography>
                <TouchableOpacity onPress={() => setSelectedMemberSummary(null)}>
                  <Typography variant="caption" color="error">Clear</Typography>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryDetailGrid}>
                <View style={styles.summaryItem}>
                  <Typography variant="caption" color="secondary">Total Purchased</Typography>
                  <Typography variant="body" style={{ fontWeight: '700', color: theme.colors.primary }}>
                    {selectedMemberSummary.totalPurchasedSessions}
                  </Typography>
                </View>
                <View style={styles.summaryItem}>
                  <Typography variant="caption" color="secondary">Sessions Used</Typography>
                  <Typography variant="body" style={{ fontWeight: '700', color: theme.colors.success }}>
                    {selectedMemberSummary.sessionsUsed}
                  </Typography>
                </View>
                <View style={styles.summaryItem}>
                  <Typography variant="caption" color="secondary">Remaining Credits</Typography>
                  <Typography variant="body" style={{ fontWeight: '700', color: theme.colors.info }}>
                    {selectedMemberSummary.remainingSessions}
                  </Typography>
                </View>
                <View style={styles.summaryItem}>
                  <Typography variant="caption" color="secondary">Expiry Date</Typography>
                  <Typography variant="bodySm" style={{ fontWeight: '700' }}>
                    {new Date(selectedMemberSummary.expiryDate).toLocaleDateString()}
                  </Typography>
                </View>
              </View>

              {selectedMemberSummary.lastGymVisited && (
                <View style={{ marginTop: theme.spacing.md }}>
                  <Typography variant="caption" color="secondary">Last Gym Visited</Typography>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={12} color={theme.colors.primary} />
                    <Typography variant="bodySm" style={{ fontWeight: '700' }}>
                      {selectedMemberSummary.lastGymVisited}
                    </Typography>
                  </View>
                </View>
              )}
            </Card>
          ) : (
            <View style={styles.emptySearchWrapper}>
              <Typography variant="caption" color="muted">No member selected. Search above to view info.</Typography>
            </View>
          )}
        </Card>

        {/* Partner Popularity ranking table */}
        <Card style={styles.sectionCard}>
          <Typography variant="body" style={styles.sectionTitle}>
            <MapPin size={16} /> Most Visited Partner Gyms
          </Typography>
          {(fitpassData?.mostVisitedPartnerGyms || []).length === 0 ? (
            <Typography variant="caption" color="muted" style={{ marginVertical: theme.spacing.sm }}>
              No check-in logs found.
            </Typography>
          ) : (
            (fitpassData.mostVisitedPartnerGyms || []).map((g: any, index: number) => (
              <View key={g.gymId || index} style={styles.gymRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <View style={[styles.rankCircle, index === 0 && { backgroundColor: theme.colors.primary }]}>
                    <Typography variant="caption" style={{ fontWeight: '800', color: index === 0 ? 'black' : theme.colors.text }}>
                      {index + 1}
                    </Typography>
                  </View>
                  <Typography variant="bodySm" style={{ fontWeight: '700' }}>{g.gymName}</Typography>
                </View>
                <Typography variant="bodySm" style={{ fontWeight: '800', color: theme.colors.success }}>
                  {g.count} visits
                </Typography>
              </View>
            ))
          )}
        </Card>

        {/* Daily network traffic */}
        <Card style={styles.sectionCard}>
          <Typography variant="body" style={styles.sectionTitle}>
            <Calendar size={16} /> Daily Network Traffic
          </Typography>
          {(fitpassData?.dailyCheckIns || []).length === 0 ? (
            <Typography variant="caption" color="muted">No daily check-ins recorded.</Typography>
          ) : (
            (fitpassData.dailyCheckIns || []).slice(-10).reverse().map((d: any, idx: number) => (
              <View key={d.date || idx} style={styles.trafficRow}>
                <Typography variant="bodySm" style={{ fontWeight: '600' }}>
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Typography>
                <Badge label={`${d.count} check-ins`} variant="active" />
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    );
  }

  // ----------------------------------------------------
  // H4 PORTAL VIEW RENDER (STANDARD OVERVIEW)
  // ----------------------------------------------------
  if (isH4Loading) {
    return (
      <View style={styles.loadingContainer}>
        <Skeleton height={50} style={{ marginBottom: theme.spacing.md }} />
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <View key={idx} style={styles.gridItemSkeleton}>
              <Skeleton height={100} />
            </View>
          ))}
        </View>
        <Skeleton height={220} style={{ marginTop: theme.spacing.lg }} />
      </View>
    );
  }

  const kpis: KpiData[] = [
    {
      title: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: <Users size={20} color={theme.colors.primary} />,
      color: theme.colors.primary,
      bgColor: theme.colors.brandLight,
    },
    {
      title: 'Active Members',
      value: stats?.activeMembers || 0,
      icon: <CheckCircle size={20} color={theme.colors.success} />,
      color: theme.colors.success,
      bgColor: 'rgba(0, 255, 102, 0.1)',
    },
    {
      title: 'Expired Members',
      value: stats?.expiredMembers || 0,
      icon: <AlertTriangle size={20} color={theme.colors.error} />,
      color: theme.colors.error,
      bgColor: 'rgba(255, 0, 68, 0.1)',
    },
    {
      title: 'Expiring Soon',
      value: stats?.expiringSoonCount || 0,
      icon: <Clock size={20} color={theme.colors.warning} />,
      color: theme.colors.warning,
      bgColor: 'rgba(255, 214, 0, 0.1)',
    },
    {
      title: 'New This Month',
      value: stats?.newMembersThisMonth || 0,
      icon: <Sparkles size={20} color={theme.colors.info} />,
      color: theme.colors.info,
      bgColor: 'rgba(0, 255, 255, 0.1)',
    },
    {
      title: 'Global Revenue',
      value: `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: <DollarSign size={20} color={theme.colors.success} />,
      color: theme.colors.success,
      bgColor: 'rgba(0, 255, 102, 0.1)',
    },
    {
      title: 'Global Expenses',
      value: `₹${(stats?.monthlyExpenses || 0).toLocaleString()}`,
      icon: <ArrowDown size={20} color={theme.colors.error} />,
      color: theme.colors.error,
      bgColor: 'rgba(255, 0, 68, 0.1)',
    },
    {
      title: 'Global Profit',
      value: `₹${(stats?.monthlyProfit || 0).toLocaleString()}`,
      icon: <ArrowUp size={20} color={theme.colors.success} />,
      color: theme.colors.success,
      bgColor: 'rgba(0, 255, 102, 0.1)',
    },
  ];

  const trend = formatTrendData(stats?.revenueTrend);
  const planBreakdown = formatPlanData(stats?.planBreakdown);

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <BranchSelector />
      <Typography variant="h3" style={styles.sectionHeader}>Global Overview</Typography>

      <View style={styles.grid}>
        {kpis.map((kpi, idx) => (
          <View key={idx} style={styles.gridItem}>
            <Card accentColor={kpi.color} style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Typography variant="caption" color="secondary" style={styles.kpiTitle} numberOfLines={1}>
                  {kpi.title}
                </Typography>
                <View style={[styles.kpiIconWrapper, { backgroundColor: kpi.bgColor }]}>
                  {kpi.icon}
                </View>
              </View>
              <Typography variant="h2" style={styles.kpiValue} numberOfLines={1}>
                {kpi.value}
              </Typography>
            </Card>
          </View>
        ))}
      </View>

      <Typography variant="h3" style={styles.sectionHeader}>Financial Performance</Typography>
      
      <Card style={styles.chartCard}>
        <Typography variant="body" style={styles.chartTitle}>Revenue Trends</Typography>
        <LineChart
          data={{
            labels: trend.labels,
            datasets: [{ data: trend.data }],
          }}
          width={width - 48} // Padding adjustments
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>

      <Card style={styles.chartCard}>
        <Typography variant="body" style={styles.chartTitle}>Popular Subscription Plans</Typography>
        <BarChart
          data={{
            labels: planBreakdown.labels,
            datasets: [{ data: planBreakdown.data }],
          }}
          width={width - 48}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sectionHeader: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  gridItemSkeleton: {
    width: '50%',
    padding: theme.spacing.xs,
  },
  kpiCard: {
    padding: theme.spacing.md,
    height: 104,
    justifyContent: 'space-between',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  kpiIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  chartCard: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  chartTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.radii.lg,
    marginVertical: theme.spacing.sm,
  },
  // FitPass specific styling
  fitpassHeaderCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  sectionCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  searchBtn: {
    height: 48,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  resultsList: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    maxHeight: 180,
    backgroundColor: theme.colors.bgTertiary,
  },
  memberResultRow: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bgTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  summaryDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  summaryItem: {
    width: '45%',
  },
  emptySearchWrapper: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trafficRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});
