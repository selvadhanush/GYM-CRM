import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge, Skeleton, EmptyState } from '@/components/ui';
import { useSessionHistory } from '../api/fitpass.api';

export function CheckInHistory() {
  const { data, isLoading } = useSessionHistory(1);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} style={styles.skeletonRow} />
        ))}
      </View>
    );
  }

  const items = data?.data ?? [];
  if (items.length === 0) {
    return <EmptyState title="No History" description="No check-in history found." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Check-in History</Typography>
      {items.map((item) => {
        const statusColor =
          item.status === 'Completed'
            ? theme.colors.success
            : item.status === 'Active'
            ? theme.colors.info
            : theme.colors.error;

        return (
          <Card key={item.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <Typography variant="bodySm">{item.gymName}</Typography>
              {item.branchName && (
                <Typography variant="caption" color="secondary">{item.branchName}</Typography>
              )}
              <Typography variant="caption" color="muted">
                {new Date(item.startedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </View>
            <Badge label={item.status} variant={item.status === 'Completed' ? 'success' : item.status === 'Active' ? 'info' : 'expired'} />
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  title: { color: theme.colors.text, marginBottom: theme.spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  rowLeft: { flex: 1, gap: theme.spacing.xs },
  skeletonRow: { height: 64, borderRadius: theme.radii.md, marginBottom: theme.spacing.xs },
});
