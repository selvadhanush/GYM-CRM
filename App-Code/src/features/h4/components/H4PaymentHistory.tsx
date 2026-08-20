import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Skeleton } from '@/components/ui';
import { useH4Payments } from '../api/h4.api';
import { CreditCard, Award } from 'lucide-react-native';
import { H4TopHeader } from './H4TopHeader';

export function H4PaymentHistory() {
  const { data, isLoading } = useH4Payments();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} style={styles.skeleton} />
        ))}
      </View>
    );
  }

  const items = data?.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <H4TopHeader title="Payments & Renewals" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerGroup}>
          <View style={styles.headerIconWrap}>
            <Award size={18} color={theme.colors.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h2" style={styles.headerTitle}>Renewals & Receipts</Typography>
            <Typography variant="caption" color="secondary" style={styles.headerSub}>
              Track paid invoices and membership renewal records
            </Typography>
          </View>
        </View>

        {items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CreditCard size={32} color={theme.colors.textMuted} />
            <Typography variant="bodySm" color="secondary" style={styles.emptyText}>No payment records found.</Typography>
          </Card>
        ) : (
          <View style={styles.paymentList}>
            {items.map((p) => (
              <Card key={p.id} style={styles.row}>
                <View style={styles.icon}>
                  <CreditCard size={16} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Typography variant="bodySm" style={styles.planNameText}>
                    {p.planName || 'Membership Payment'}
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.paymentMeta}>
                    {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.method}
                  </Typography>
                </View>
                <Typography variant="bodySm" style={styles.amountText}>₹{p.amount}</Typography>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingBottom: 100, gap: 16 },
  loadingContainer: { flex: 1, padding: 18, gap: 12, backgroundColor: theme.colors.background },
  
  headerGroup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 4 
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    color: theme.colors.text, 
    fontWeight: '800', 
    fontSize: 20 
  },
  headerSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  paymentList: { gap: 10 },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 16, 
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  planNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  paymentMeta: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.success,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 160, 32, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: { 
    padding: 30, 
    alignItems: 'center', 
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  skeleton: { height: 64, borderRadius: 16 },
});
