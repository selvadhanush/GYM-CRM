import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Skeleton } from '@/components/ui';
import { useH4Payments } from '../api/h4.api';
import { CreditCard } from 'lucide-react-native';

export function H4PaymentHistory() {
  const { data, isLoading } = useH4Payments();

  if (isLoading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} style={styles.skeleton} />
        ))}
      </View>
    );
  }

  const items = data?.data ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Payment History</Typography>
      {items.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Typography variant="bodySm" color="secondary">No payment records found.</Typography>
        </Card>
      ) : (
        items.map((p) => (
          <Card key={p.id} style={styles.row}>
            <View style={styles.icon}>
              <CreditCard size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="bodySm">{p.planName ?? 'Plan Payment'}</Typography>
              <Typography variant="caption" color="secondary">
                {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.method}
              </Typography>
            </View>
            <Typography variant="bodySm" style={{ color: theme.colors.success }}>₹{p.amount}</Typography>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  title: { color: theme.colors.text, marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.sm, marginBottom: theme.spacing.xs },
  icon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: { padding: theme.spacing.md, alignItems: 'center' },
  skeleton: { height: 64, borderRadius: theme.radii.md, marginBottom: theme.spacing.xs },
});
