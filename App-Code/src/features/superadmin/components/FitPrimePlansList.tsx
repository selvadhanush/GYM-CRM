import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Ticket, Trash2 } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { useToast } from '@/hooks/useToast';
import { useFitPrimePlans, useCreateFitPrimePlan, useDeleteFitPrimePlan } from '../api/superadmin.api';
import { Card, Button, Input, Modal, Skeleton, EmptyState, Badge, Typography } from '@/components/ui';

export const FitPrimePlansList: React.FC = () => {
  const toast = useToast();
  const { data: plans, isLoading } = useFitPrimePlans();
  const createPlanMutation = useCreateFitPrimePlan();
  const deletePlanMutation = useDeleteFitPrimePlan();

  // Create Form States
  const [name, setName] = useState('');
  const [sessions, setSessions] = useState('');
  const [price, setPrice] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreate = () => {
    if (!name || !sessions || !price) {
      toast.show('Please fill in all fields', 'error');
      return;
    }

    if (Number(sessions) <= 0) {
      toast.show('Sessions must be a positive number', 'error');
      return;
    }

    createPlanMutation.mutate({
      name,
      sessions: Number(sessions),
      price: Number(price),
    }, {
      onSuccess: () => {
        toast.show('FitPrime global plan created!', 'success');
        setName('');
        setSessions('');
        setPrice('');
        setShowCreateModal(false);
      },
      onError: (err: any) => {
        toast.show(err.response?.data?.message || 'Failed to create plan', 'error');
      }
    });
  };

  const handleDelete = (planId: string) => {
    Alert.alert(
      'Delete FitPrime Plan',
      'Are you sure you want to delete this global plan? Current members will keep their remaining session balances.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlanMutation.mutate(planId, {
              onSuccess: () => {
                toast.show('FitPrime global plan deleted.', 'success');
              },
              onError: (err: any) => {
                toast.show(err.response?.data?.message || 'Failed to delete plan', 'error');
              }
            });
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View>
        <Skeleton height={48} style={{ marginBottom: theme.spacing.lg }} />
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <View key={idx} style={styles.gridItemSkeleton}>
              <Skeleton height={140} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Button
        title="+ Create FitPrime Plan"
        onPress={() => setShowCreateModal(true)}
        style={{ marginBottom: theme.spacing.lg }}
      />

      {plans?.length === 0 ? (
        <EmptyState
          iconText="📋"
          title="No Global Plans Found"
          description="Create global session-based subscription plans to offer across your partner gyms network."
        />
      ) : (
        <View style={styles.grid}>
          {plans?.map((plan) => (
            <View key={plan._id} style={styles.gridItem}>
              <Card style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Typography variant="body" style={styles.planName} numberOfLines={1}>
                    {plan.name}
                  </Typography>
                  <Badge label="Global" variant="info" style={styles.badge} />
                </View>

                <View style={styles.priceRow}>
                  <Typography variant="h2" style={styles.priceLabel}>₹{plan.price}</Typography>
                </View>

                <View style={styles.sessionsRow}>
                  <Ticket size={14} color={theme.colors.primary} />
                  <Typography variant="caption" color="secondary" style={styles.sessionsText}>
                    {plan.sessions} sessions
                  </Typography>
                </View>

                <Button
                  title="Delete"
                  variant="danger"
                  icon={<Trash2 size={14} color={theme.colors.error} />}
                  onPress={() => handleDelete(plan._id)}
                  style={styles.deleteBtn}
                />
              </Card>
            </View>
          ))}
        </View>
      )}

      {/* CREATE PLAN MODAL */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create FitPrime Plan"
      >
        <Input
          label="Plan Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g. 10 Sessions Pass"
        />
        <Input
          label="Sessions Count (number of check-ins) *"
          value={sessions}
          onChangeText={setSessions}
          placeholder="e.g. 10"
          keyboardType="numeric"
        />
        <Input
          label="Price (₹) *"
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 1499"
          keyboardType="numeric"
        />

        <Button
          title="Create Global Plan"
          loading={createPlanMutation.isPending}
          onPress={handleCreate}
          style={{ marginTop: theme.spacing.md }}
        />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: theme.spacing.xs,
  },
  gridItemSkeleton: {
    width: '50%',
    padding: theme.spacing.xs,
  },
  planCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  planName: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.xs,
  },
  priceRow: {
    marginVertical: theme.spacing.xs,
  },
  priceLabel: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontWeight: '800',
  },
  sessionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  sessionsText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  deleteBtn: {
    minHeight: 36,
    paddingVertical: 0,
  },
});
