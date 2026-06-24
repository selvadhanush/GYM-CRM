import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '@/theme';
import { api } from '@/services/api';

export default function FitPrimePlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sessions, setSessions] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/superadmin/plans');
      setPlans(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlanId(null);
    setName('');
    setSessions('');
    setPrice('');
    setModalVisible(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlanId(plan._id || plan.id);
    setName(plan.name);
    setSessions(plan.sessions?.toString() || plan.duration?.toString() || '');
    setPrice(plan.price?.toString() || '');
    setModalVisible(true);
  };

  const handleSavePlan = async () => {
    if (!name || !sessions || !price) {
      Alert.alert('Validation', 'Please fill in all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name,
        sessions: parseInt(sessions),
        price: parseFloat(price)
      };

      if (editingPlanId) {
        await api.put(`/superadmin/plans/${editingPlanId}`, payload);
      } else {
        await api.post('/superadmin/plans', payload);
      }

      setModalVisible(false);
      fetchPlans();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = (id: string) => {
    Alert.alert(
      "Delete Plan",
      "Are you sure you want to delete this Fit-Prime plan?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/superadmin/plans/${id}`);
              fetchPlans();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete plan');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderPlanCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="briefcase-outline" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
            <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeletePlan(item._id || item.id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>SESSIONS</Text>
          <View style={styles.detailValueRow}>
            <Ionicons name="layers-outline" size={16} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.detailValue}>{item.sessions ?? item.duration}</Text>
          </View>
        </View>
        
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>TYPE</Text>
          <View style={styles.globalBadge}>
            <Text style={styles.globalBadgeText}>Global Pass</Text>
          </View>
        </View>

        <View style={[styles.detailColumn, { alignItems: 'flex-end' }]}>
          <Text style={styles.detailLabel}>PRICE</Text>
          <Text style={styles.cardPrice}>₹{item.price}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fit-Prime Plans</Text>
          <Text style={styles.subtitle}>Manage your enterprise subscriptions</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Plan</Text>
        </TouchableOpacity>
      </View>

      {loading && !submitting ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderPlanCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={COLORS.textMuted} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyText}>No premium plans configured.</Text>
            </View>
          }
        />
      )}

      {/* Professional Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPlanId ? 'Edit Plan' : 'Create New Plan'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Plan Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Corporate 10-Pack"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Sessions</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="layers-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Count"
                    placeholderTextColor={COLORS.textMuted}
                    value={sessions}
                    onChangeText={setSessions}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Price (₹)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Amount"
                    placeholderTextColor={COLORS.textMuted}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSavePlan}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingPlanId ? 'Save Changes' : 'Create Plan'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' }, // Clean light gray bg
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16,
  },
  title: { ...FONTS.bold, fontSize: 28, color: '#1A1C1E' },
  subtitle: { ...FONTS.regular, fontSize: 14, color: '#6B7280', marginTop: 4 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
    ...SHADOWS.sm,
  },
  addButtonText: { ...FONTS.semibold, color: '#fff', marginLeft: 6, fontSize: 14 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 16,
    ...SHADOWS.sm,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTopRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    backgroundColor: 'rgba(255, 122, 0, 0.1)', padding: 8, borderRadius: 8, marginRight: 12
  },
  cardTitle: { ...FONTS.semibold, fontSize: 18, color: '#111827' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { 
    padding: 6, backgroundColor: '#F3F4F6', borderRadius: 6 
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  cardBody: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  detailColumn: { justifyContent: 'center' },
  detailLabel: { ...FONTS.semibold, fontSize: 11, color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 6 },
  detailValueRow: { flexDirection: 'row', alignItems: 'center' },
  detailValue: { ...FONTS.semibold, fontSize: 16, color: '#374151' },
  cardPrice: { ...FONTS.bold, fontSize: 20, color: '#111827' },
  globalBadge: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, borderColor: '#D1FAE5'
  },
  globalBadgeText: { ...FONTS.semibold, fontSize: 12, color: '#059669' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
  emptyText: { ...FONTS.medium, color: '#9CA3AF', fontSize: 15 },
  
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.4)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28,
  },
  modalTitle: { ...FONTS.bold, fontSize: 20, color: '#111827' },
  closeBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 20 },
  formGroup: { marginBottom: 20 },
  inputLabel: { ...FONTS.medium, fontSize: 13, color: '#4B5563', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  currencyPrefix: { ...FONTS.semibold, fontSize: 16, color: '#9CA3AF', marginRight: 8 },
  input: {
    flex: 1, color: '#111827', ...FONTS.regular,
    fontSize: 15, paddingVertical: 14,
  },
  row: { flexDirection: 'row' },
  modalFooter: { flexDirection: 'row', marginTop: 12, gap: 12 },
  cancelButton: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center'
  },
  cancelButtonText: { ...FONTS.semibold, fontSize: 15, color: '#4B5563' },
  submitButton: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm
  },
  submitButtonText: { ...FONTS.semibold, fontSize: 15, color: '#FFFFFF' },
});
