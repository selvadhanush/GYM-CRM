import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '@/theme';
import type { Plan } from '@/types';

export default function AdminPlansScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'local'>('global');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await adminService.getPlans();
      setPlans(response || []);
    } catch (error) {
      console.warn('Fetch Plans Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const handleOpenModal = (plan: Plan | null = null) => {
    if (plan) {
      setEditingPlan(plan);
      setName(plan.name);
      setDuration(plan.duration?.toString() || '');
      setPrice(plan.price?.toString() || '');
    } else {
      setEditingPlan(null);
      setName('');
      setDuration('');
      setPrice('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !duration.trim() || !price.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        duration: parseInt(duration, 10),
        price: parseFloat(price),
      };

      if (editingPlan) {
        await adminService.updatePlan(editingPlan._id || editingPlan.id, payload);
        Alert.alert('Success', 'Plan updated successfully.');
      } else {
        await adminService.createPlan(payload);
        Alert.alert('Success', 'Plan created successfully.');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.deletePlan(plan._id || plan.id);
              Alert.alert('Success', 'Plan deleted successfully.');
              fetchPlans();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete plan.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const globalPlans = plans.filter(p => p.gymId === 'SYSTEM');
  const localPlans = plans.filter(p => p.gymId !== 'SYSTEM');
  const displayedPlans = activeTab === 'global' ? globalPlans : localPlans;

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Membership Plans</Text>
          <Text style={styles.subtitle}>Configure passes and subscriptions for members</Text>
        </View>

        {/* Custom Segmented Control */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'global' && styles.activeTab]}
            onPress={() => setActiveTab('global')}
          >
            <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>
              Global Plans
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'local' && styles.activeTab]}
            onPress={() => setActiveTab('local')}
          >
            <Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>
              Local Gym Plans
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'local' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add New Plan</Text>
          </TouchableOpacity>
        )}

        {displayedPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              No {activeTab === 'global' ? 'Global' : 'Local'} plans available
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {displayedPlans.map((plan) => (
              <View key={plan._id || plan.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name={activeTab === 'global' ? 'planet' : 'home'}
                    size={24}
                    color={activeTab === 'global' ? COLORS.secondary : COLORS.primary}
                  />
                  <View style={activeTab === 'global' ? styles.tagGlobal : styles.tagLocal}>
                    <Text style={activeTab === 'global' ? styles.tagTextGlobal : styles.tagTextLocal}>
                      {activeTab === 'global' ? 'Global' : 'Local'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.planName}>{plan.name}</Text>

                <View style={styles.cardBody}>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.detailText}>
                        {plan.gymId === 'SYSTEM' ? `${plan.sessions} sessions` : `${plan.duration} days`}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="cash-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.detailText}>₹{plan.price}</Text>
                    </View>
                  </View>

                  {activeTab === 'local' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleOpenModal(plan)} style={styles.actionBtn}>
                        <Ionicons name="pencil-sharp" size={18} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(plan)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Plan modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPlan ? 'Edit Local Plan' : 'Create Local Plan'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Plan Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="text-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3 Months Basic"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Duration (days)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 90"
                  placeholderTextColor={COLORS.textMuted}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Price (₹)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2999"
                  placeholderTextColor={COLORS.textMuted}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingPlan ? 'Save changes' : 'Create plan'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.hero,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginTop: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    ...FONTS.semibold,
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    ...FONTS.semibold,
    marginLeft: SPACING.xs,
    fontSize: 14,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tagGlobal: {
    backgroundColor: 'rgba(0,206,201,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  tagLocal: {
    backgroundColor: 'rgba(255,122,0,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  tagTextGlobal: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.xs,
    ...FONTS.semibold,
    textTransform: 'uppercase',
  },
  tagTextLocal: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    ...FONTS.semibold,
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginBottom: SPACING.md,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    ...FONTS.medium,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    ...FONTS.medium,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  currencyPrefix: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginRight: 8,
    ...FONTS.semibold,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    ...FONTS.regular,
    fontSize: 15,
    paddingVertical: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    ...FONTS.semibold,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    ...FONTS.semibold,
  },
});
