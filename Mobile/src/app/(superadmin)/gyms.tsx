import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

// --- Premium Modern Light Palette ---
const PALETTE = {
  bg: '#F9FAFB', // Ultra-light gray for the main background
  surface: '#FFFFFF', // Pure white for floating cards
  surfaceHighlight: '#F3F4F6', // Subtle gray for icon button backgrounds
  textPrimary: '#111827', // Deep slate for sharp text contrast
  textSecondary: '#6B7280', // Soft slate for secondary text
  accent: '#2563EB', // Premium royal blue
  accentMuted: 'rgba(37, 99, 235, 0.1)', // Soft blue tint for icon wrappers
  border: '#E5E7EB', // Gentle borders
  danger: '#EF4444', // Clean red
  dangerMuted: 'rgba(239, 68, 68, 0.1)', // Soft red tint
  white: '#FFFFFF',
};

export default function PartnerGyms() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGym, setEditingGym] = useState<any>(null);

  const [gymName, setGymName] = useState('');
  const [gymAddress, setGymAddress] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    fetchGyms();
  }, []);

  const fetchGyms = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get<any[]>('/superadmin/gyms');
      setGyms(data.filter((g) => g.name !== 'SYSTEM'));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch gyms');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCreateGym = async () => {
    if (!gymName || !adminName || !adminEmail || !adminPassword) {
      Alert.alert('Validation', 'Please fill in all required fields.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/superadmin/gyms', { gymName, gymAddress, adminName, adminEmail, adminPassword });
      setModalVisible(false);
      setGymName(''); setGymAddress(''); setAdminName(''); setAdminEmail(''); setAdminPassword('');
      fetchGyms(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create gym');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGym = async () => {
    if (!editingGym?.name) return;
    try {
      setSubmitting(true);
      const payload: any = {};
      if (editingGym.name) payload.name = editingGym.name;
      if (editingGym.address !== undefined && editingGym.address !== null) payload.address = editingGym.address;
      if (editingGym.email !== undefined && editingGym.email !== null) payload.email = editingGym.email;
      if (editingGym.phone !== undefined && editingGym.phone !== null) payload.phone = editingGym.phone;

      if (editingGym.adminPassword && editingGym.adminPassword.trim() !== '') {
        payload.adminPassword = editingGym.adminPassword;
      }

      await api.put(`/superadmin/gyms/${editingGym._id || editingGym.id}`, payload);
      setEditModalVisible(false);
      setEditingGym(null);
      fetchGyms(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update gym');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGym = async (gym: any) => {
    Alert.alert('Remove Gym', `Are you sure you want to permanently delete ${gym.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            // Optimistically update UI to prevent any visual delay
            setGyms(prev => prev.filter(g => (g._id || g.id) !== (gym._id || gym.id)));
            await api.delete(`/superadmin/gyms/${gym._id || gym.id}`);
            // Silently sync with server
            fetchGyms(true);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete');
            // Revert on error
            fetchGyms(true);
          }
        }
      }
    ]);
  };

  const renderGymCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrapper}>
          <Ionicons name="barbell-outline" size={22} color={PALETTE.accent} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{item.address || 'Address not provided'}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <View style={styles.adminRow}>
          <View style={styles.adminDetails}>
            <Text style={styles.adminName}>{item.admins?.[0]?.name || 'No Admin'}</Text>
            <Text style={styles.adminEmail}>{item.admins?.[0]?.email || 'N/A'}</Text>
          </View>
          <View style={styles.actionsGroup}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => { setEditingGym({ ...item }); setEditModalVisible(true); }}>
              <Ionicons name="create-outline" size={20} color={PALETTE.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => handleDeleteGym(item)}>
              <Ionicons name="trash-outline" size={20} color={PALETTE.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Partner Gyms</Text>
        <Text style={styles.headerSubtitle}>Manage your fitness network</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={PALETTE.accent} />
        </View>
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderGymCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color={PALETTE.border} />
              <Text style={styles.emptyText}>No gyms in the network.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Capsule */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={PALETTE.bg} />
          <Text style={styles.fabText}>Add Partner</Text>
        </TouchableOpacity>
      </View>

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Partner</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={PALETTE.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <TextInput style={styles.input} value={gymName} onChangeText={setGymName} placeholder="Facility Name" placeholderTextColor={PALETTE.textSecondary} />
              <TextInput style={styles.input} value={gymAddress} onChangeText={setGymAddress} placeholder="Headquarters Address" placeholderTextColor={PALETTE.textSecondary} />
              <TextInput style={styles.input} value={adminName} onChangeText={setAdminName} placeholder="Admin Name" placeholderTextColor={PALETTE.textSecondary} />
              <TextInput style={styles.input} value={adminEmail} onChangeText={setAdminEmail} placeholder="Admin Email" placeholderTextColor={PALETTE.textSecondary} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} value={adminPassword} onChangeText={setAdminPassword} placeholder="Initial Password" placeholderTextColor={PALETTE.textSecondary} secureTextEntry />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateGym} disabled={submitting}>
              {submitting ? <ActivityIndicator color={PALETTE.bg} /> : <Text style={styles.submitBtnText}>Create Network Partner</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Partner</Text>
              <TouchableOpacity onPress={() => { setEditModalVisible(false); setEditingGym(null); }} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={PALETTE.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <TextInput style={styles.input} value={editingGym?.name || ''} onChangeText={(text) => setEditingGym({ ...editingGym, name: text })} placeholder="Facility Name" placeholderTextColor={PALETTE.textSecondary} />
              <TextInput style={styles.input} value={editingGym?.address || ''} onChangeText={(text) => setEditingGym({ ...editingGym, address: text })} placeholder="Headquarters Address" placeholderTextColor={PALETTE.textSecondary} />
              <TextInput style={styles.input} value={editingGym?.email || ''} onChangeText={(text) => setEditingGym({ ...editingGym, email: text })} placeholder="Facility Email" placeholderTextColor={PALETTE.textSecondary} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} value={editingGym?.phone || ''} onChangeText={(text) => setEditingGym({ ...editingGym, phone: text })} placeholder="Facility Phone Number" placeholderTextColor={PALETTE.textSecondary} keyboardType="phone-pad" />
              <TextInput style={styles.input} value={editingGym?.adminPassword || ''} onChangeText={(text) => setEditingGym({ ...editingGym, adminPassword: text })} placeholder="New Admin Password (leave blank to keep current)" placeholderTextColor={PALETTE.textSecondary} secureTextEntry />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateGym} disabled={submitting}>
              {submitting ? <ActivityIndicator color={PALETTE.bg} /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  headerTitle: { fontSize: 32, color: PALETTE.textPrimary, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: PALETTE.textSecondary, fontWeight: '400' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 16 },
  emptyText: { color: PALETTE.textSecondary, fontSize: 15 },

  card: {
    backgroundColor: PALETTE.surface, borderRadius: 20, marginBottom: 16,
    borderWidth: 1, borderColor: PALETTE.border,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 6 },
    })
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrapper: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: PALETTE.accentMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: PALETTE.textPrimary, letterSpacing: -0.3, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: PALETTE.textSecondary, fontWeight: '400' },

  cardDivider: { height: 1, backgroundColor: PALETTE.border, marginVertical: 16 },

  cardBody: {},
  adminRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminDetails: { flex: 1 },
  adminName: { fontSize: 15, fontWeight: '500', color: PALETTE.textPrimary, marginBottom: 2 },
  adminEmail: { fontSize: 13, color: PALETTE.textSecondary },

  actionsGroup: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: PALETTE.surfaceHighlight,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnDanger: { backgroundColor: PALETTE.dangerMuted },

  fabContainer: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 32, left: 0, right: 0,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: PALETTE.accent, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 100,
    ...Platform.select({
      ios: { shadowColor: PALETTE.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 8 },
    })
  },
  fabText: { color: PALETTE.bg, fontSize: 15, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: {
    backgroundColor: PALETTE.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: PALETTE.border,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: PALETTE.textPrimary },
  closeBtn: { padding: 4 },

  form: { gap: 16 },
  input: {
    backgroundColor: PALETTE.bg, color: PALETTE.textPrimary, fontSize: 15,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: PALETTE.border,
  },

  submitBtn: {
    backgroundColor: PALETTE.textPrimary, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', marginTop: 24,
  },
  submitBtnText: { color: PALETTE.bg, fontSize: 15, fontWeight: '600' },
});
