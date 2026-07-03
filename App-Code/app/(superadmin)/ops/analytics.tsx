import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Tabs, useRouter } from 'expo-router';
import { ArrowLeft, TrendingDown, RefreshCw, Award, AlertTriangle } from 'lucide-react-native';
import { BarChart } from 'react-native-chart-kit';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge } from '@/components/ui';
import { SafeAreaWrapper } from '@/components/layout';
import { API_CLIENT } from '@/lib/api-client';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();

  // Query Analytics Data
  const { data: analyticsData, isLoading, error } = useQuery<any>({
    queryKey: ['h4-analytics'],
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/analytics');
      return data;
    },
  });

  if (isLoading) {
    return (
      <SafeAreaWrapper scrollable={false}>
        <Tabs.Screen options={{ title: 'Analytics' }} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Typography style={{ marginTop: theme.spacing.md }}>Compiling business metrics...</Typography>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (error || !analyticsData) {
    return (
      <SafeAreaWrapper scrollable={false}>
        <Tabs.Screen options={{ title: 'Analytics' }} />
        <View style={styles.loaderContainer}>
          <Typography color="error">Failed to compile churn and retention analytics.</Typography>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Bar Chart Configuration
  const trendLabels = (analyticsData.churnTrend || []).map((t: any) => t.month);
  const trendValues = (analyticsData.churnTrend || []).map((t: any) => t.churned || 0);

  const chartData = {
    labels: trendLabels.length > 0 ? trendLabels : ['N/A'],
    datasets: [
      {
        data: trendValues.length > 0 ? trendValues : [0],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ef4444',
    },
  };

  return (
    <SafeAreaWrapper scrollable={false}>
      <Tabs.Screen 
        options={{ 
          title: 'Business Analytics',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace('/(superadmin)/ops-hub')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft color={theme.colors.text} size={20} />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI metrics row */}
        <View style={styles.statsGrid}>
          <Card style={StyleSheet.flatten([styles.statCard, { borderLeftColor: '#ef4444' }])}>
            <View style={styles.statHeader}>
              <Typography variant="caption" color="secondary">Churn Rate (30d)</Typography>
              <TrendingDown size={18} color="#ef4444" />
            </View>
            <Typography variant="h2" style={styles.statValue}>{analyticsData.churnRate}%</Typography>
            <Typography variant="caption" color="muted">{analyticsData.expiredLast30} churned</Typography>
          </Card>

          <Card style={StyleSheet.flatten([styles.statCard, { borderLeftColor: '#10b981' }])}>
            <View style={styles.statHeader}>
              <Typography variant="caption" color="secondary">Renewal Rate (90d)</Typography>
              <RefreshCw size={18} color="#10b981" />
            </View>
            <Typography variant="h2" style={styles.statValue}>{analyticsData.renewalRate}%</Typography>
            <Typography variant="caption" color="muted">{analyticsData.renewedCount} renewed</Typography>
          </Card>
        </View>

        <View style={styles.statsGrid}>
          <Card style={StyleSheet.flatten([styles.statCard, { borderLeftColor: '#8b5cf6' }])}>
            <View style={styles.statHeader}>
              <Typography variant="caption" color="secondary">Avg Lifetime Value</Typography>
              <Award size={18} color="#8b5cf6" />
            </View>
            <Typography variant="h2" style={styles.statValue}>₹{analyticsData.avgLTV}</Typography>
            <Typography variant="caption" color="muted">Average total paid</Typography>
          </Card>

          <Card style={StyleSheet.flatten([styles.statCard, { borderLeftColor: '#f59e0b' }])}>
            <View style={styles.statHeader}>
              <Typography variant="caption" color="secondary">Inactive (7d)</Typography>
              <AlertTriangle size={18} color="#f59e0b" />
            </View>
            <Typography variant="h2" style={styles.statValue}>{analyticsData.inactiveCount}</Typography>
            <Typography variant="caption" color="muted">No attendance logs</Typography>
          </Card>
        </View>

        {/* Churn Chart */}
        <Card style={styles.chartCard}>
          <Typography variant="body" style={styles.cardHeaderTitle}>📉 Monthly Churn Trend</Typography>
          {trendValues.length > 0 ? (
            <BarChart
              data={chartData}
              width={width - 48}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              yAxisLabel=""
              yAxisSuffix=""
              style={styles.chartStyle}
            />
          ) : (
            <Typography variant="caption" color="muted" style={{ marginVertical: theme.spacing.lg, textAlign: 'center' }}>
              No churn history available.
            </Typography>
          )}
        </Card>

        {/* Top Members */}
        <Card style={styles.recordsCard}>
          <Typography variant="body" style={styles.cardHeaderTitle}>💎 Top Lifetime Value Members</Typography>
          {(analyticsData.topMembers || []).length === 0 ? (
            <Typography variant="caption" color="muted">No payment metrics registered.</Typography>
          ) : (
            (analyticsData.topMembers || []).map((m: any, idx: number) => (
              <View key={m._id || idx} style={styles.memberRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <Typography variant="bodySm" style={{ fontWeight: '800', color: theme.colors.primary }}>
                    #{idx + 1}
                  </Typography>
                  <View>
                    <Typography variant="bodySm" style={{ fontWeight: '700' }}>{m.name}</Typography>
                    <Typography variant="caption" color="secondary">{m.phone}</Typography>
                  </View>
                </View>
                <Typography variant="bodySm" style={styles.payoutText}>₹{m.totalPaid}</Typography>
              </View>
            ))
          )}
        </Card>

        {/* Inactive List */}
        <Card style={styles.recordsCard}>
          <Typography variant="body" style={styles.cardHeaderTitle}>⚠️ Inactive Members (7+ Days)</Typography>
          {(analyticsData.inactiveMembers || []).length === 0 ? (
            <Typography variant="caption" color="muted">All active members checked in recently!</Typography>
          ) : (
            (analyticsData.inactiveMembers || []).map((m: any) => {
              const daysLeft = Math.ceil((new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <View key={m._id} style={styles.memberRow}>
                  <View>
                    <Typography variant="bodySm" style={{ fontWeight: '700' }}>{m.name}</Typography>
                    <Typography variant="caption" color="secondary">{m.phone} · {m.planId?.name || 'Plan'}</Typography>
                  </View>
                  <Badge 
                    label={daysLeft > 0 ? `${daysLeft}d left` : 'Expired'} 
                    variant={daysLeft > 0 ? 'warning' : 'expired'} 
                  />
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '800',
    marginVertical: 4,
  },
  chartCard: {
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  cardHeaderTitle: {
    fontWeight: '800',
    marginBottom: theme.spacing.md,
  },
  chartStyle: {
    marginVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
  },
  recordsCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  payoutText: {
    fontWeight: '700',
    color: '#10b981',
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
});
