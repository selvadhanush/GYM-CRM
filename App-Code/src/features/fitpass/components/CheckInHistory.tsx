import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useSessionHistory } from '../api/fitpass.api';
import { Calendar, Clock, ChevronLeft, ChevronRight, Zap } from 'lucide-react-native';

export function CheckInHistory() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'ALL' | 'Active' | 'Completed' | 'Expired'>('ALL');
  const { data, isLoading } = useSessionHistory(page);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} style={styles.skeletonRow} />
        ))}
      </View>
    );
  }

  const rawItems = data?.data ?? [];
  const totalRecords = data?.total ?? rawItems.length;
  const totalPages = Math.ceil(totalRecords / 20) || 1;

  const items = filter === 'ALL' ? rawItems : rawItems.filter(i => i.status === filter);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Typography variant="h1" style={styles.title}>Check-in History</Typography>
          <Typography variant="caption" color="secondary">Your FitPass workout sessions log</Typography>
        </View>
        <Badge label={`${totalRecords} Total`} variant="info" />
      </View>

      {/* Status filter chips */}
      <View style={styles.chipRow}>
        {(['ALL', 'Active', 'Completed', 'Expired'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setFilter(s)}
            style={[
              styles.chip,
              filter === s && styles.chipActive
            ]}
          >
            <Typography
              variant="caption"
              style={{
                fontWeight: '700',
                color: filter === s ? theme.colors.background : theme.colors.textSecondary
              }}
            >
              {s}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {items.length === 0 ? (
        <EmptyState title="No Sessions Found" description={filter !== 'ALL' ? `No ${filter.toLowerCase()} check-ins.` : "No check-in history found."} />
      ) : (
        items.map((item) => (
          <Card key={item.id} style={styles.row}>
            <View style={styles.iconCircle}>
              <Zap size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.rowLeft}>
              <Typography variant="h3">{item.gymName || 'Partner Gym'}</Typography>
              {item.branchName ? (
                <Typography variant="caption" color="secondary">🏢 {item.branchName}</Typography>
              ) : null}
              <View style={styles.timeRow}>
                <Clock size={11} color={theme.colors.textMuted} />
                <Typography variant="caption" color="muted" style={{ marginLeft: 3 }}>
                  {new Date(item.startedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </View>
            </View>
            <Badge
              label={item.status}
              variant={item.status === 'Completed' ? 'success' : item.status === 'Active' ? 'info' : 'expired'}
            />
          </Card>
        ))
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={[styles.pageBtn, page <= 1 && { opacity: 0.4 }]}
          >
            <ChevronLeft size={16} color={theme.colors.text} />
          </TouchableOpacity>
          <Typography variant="caption" style={{ fontWeight: '700', color: theme.colors.text }}>
            Page {page} of {totalPages}
          </Typography>
          <TouchableOpacity
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={[styles.pageBtn, page >= totalPages && { opacity: 0.4 }]}
          >
            <ChevronRight size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  title: { color: theme.colors.text, margin: 0 },
  chipRow: { flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.md },
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(240, 160, 32, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLeft: { flex: 1, gap: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRow: { height: 64, borderRadius: theme.radii.md, marginBottom: theme.spacing.xs },
});
