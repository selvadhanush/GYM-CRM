import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, Dimensions, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';

const { width } = Dimensions.get('window');

const emptyForm = { name: '', address: '', phone: '', email: '', managerName: '' };

export default function BranchesScreen() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<any | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [membersModal, setMembersModal] = useState<any | null>(null);
  const [branchMembers, setBranchMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await adminService.getBranches();
      setBranches(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openCreate = () => {
    setEditBranch(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditBranch(b);
    setFormData({
      name: b.name,
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      managerName: b.managerName || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Branch Name is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editBranch) {
        await adminService.updateBranch(editBranch._id, formData);
        Alert.alert('Success', 'Branch details updated.');
      } else {
        await adminService.createBranch(formData);
        Alert.alert('Success', 'Branch location created.');
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (branch: any) => {
    Alert.alert(
      'Delete Branch',
      `Are you sure you want to delete "${branch.name}"? Members assigned to this branch will be unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Branch',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteBranch(branch._id);
              fetchBranches();
              Alert.alert('Deleted', 'Branch location removed.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete branch.');
            }
          }
        }
      ]
    );
  };

  const viewMembers = async (branch: any) => {
    setMembersModal(branch);
    setMembersLoading(true);
    try {
      const data = await adminService.getBranchMembers(branch._id);
      setBranchMembers(data || []);
    } catch (err) {
      setBranchMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const totalMembers = branches.reduce((sum, b) => sum + (b.memberCount || 0), 0);
  const totalRevenue = branches.reduce((sum, b) => sum + (b.totalRevenue || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Branches</Text>
            <Text style={styles.subtitle}>
              {branches.length} branch(es) · {totalMembers} members
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Add Branch</Text>
          </TouchableOpacity>
        </View>

        {/* Global Overview Row */}
        <View style={styles.overviewRow}>
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>TOTAL REVENUE</Text>
            <Text style={styles.overviewVal}>₹{totalRevenue.toLocaleString()}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : branches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Gym Branches</Text>
            <Text style={styles.emptySubtitle}>Log branch locations to classify members and sales figures by region.</Text>
            <TouchableOpacity style={[styles.addBtn, { marginTop: 12 }]} onPress={openCreate}>
              <Text style={styles.addBtnText}>Add First Branch</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.branchGrid}>
            {branches.map((branch) => (
              <View key={branch._id} style={styles.branchCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.branchName}>🏢 {branch.name}</Text>
                    {branch.managerName ? (
                      <Text style={styles.branchManager}>Manager: {branch.managerName}</Text>
                    ) : null}
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                </View>

                <View style={styles.detailsGroup}>
                  {branch.address ? (
                    <Text style={styles.detailsText}>📍 {branch.address}</Text>
                  ) : null}
                  {branch.phone ? (
                    <Text style={styles.detailsText}>📞 {branch.phone}</Text>
                  ) : null}
                  {branch.email ? (
                    <Text style={styles.detailsText}>✉️ {branch.email}</Text>
                  ) : null}
                </View>

                {/* Local Stats Box */}
                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: 'rgba(255,122,0,0.06)' }]}>
                    <Text style={styles.statVal}>{branch.memberCount || 0}</Text>
                    <Text style={styles.statLabel}>Members</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: 'rgba(34,197,94,0.06)' }]}>
                    <Text style={[styles.statVal, { color: COLORS.success }]}>
                      ₹{(branch.totalRevenue || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.membersBtn} onPress={() => viewMembers(branch)}>
                    <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.membersBtnText}>Members</Text>
                  </TouchableOpacity>

                  <View style={styles.iconActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(branch)}>
                      <Ionicons name="pencil-outline" size={14} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(branch)}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editBranch ? '✏️ Edit Branch Details' : '🏢 Create Gym Branch'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Branch Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. West Coast Branch"
                  value={formData.name}
                  onChangeText={(txt) => setFormData({ ...formData, name: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Full location street address..."
                  value={formData.address}
                  onChangeText={(txt) => setFormData({ ...formData, address: txt })}
                />
              </View>

              <View style={styles.doubleInputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Contact Phone</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="phone-pad"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChangeText={(txt) => setFormData({ ...formData, phone: txt })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Contact Email</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="branch@gym.com"
                    value={formData.email}
                    onChangeText={(txt) => setFormData({ ...formData, email: txt })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Branch Manager</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Manager's full name..."
                  value={formData.managerName}
                  onChangeText={(txt) => setFormData({ ...formData, managerName: txt })}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editBranch ? 'Save Details' : 'Create Branch'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Branch Members list popup Modal */}
      {membersModal && (
        <Modal visible={!!membersModal} animationType="fade" transparent={true}>
          <View style={styles.modalBgOverlay}>
            <View style={styles.membersModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>Members: {membersModal.name}</Text>
                <TouchableOpacity onPress={() => { setMembersModal(null); setBranchMembers([]); }}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {membersLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
              ) : branchMembers.length === 0 ? (
                <Text style={styles.emptyText}>No active members registered at this branch.</Text>
              ) : (
                <FlatList
                  data={branchMembers}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.memberRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{item.name}</Text>
                        <Text style={styles.memberPhone}>{item.phone}</Text>
                      </View>
                      <View style={[styles.activeBadge, { backgroundColor: item.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                        <Text style={[styles.activeText, { color: item.status === 'Active' ? COLORS.success : '#EF4444' }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: SPACING.md, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, marginTop: 40 },
  title: { fontSize: 24, ...FONTS.bold, color: '#000' },
  subtitle: { fontSize: FONTS.sizes.sm, color: '#666', marginTop: 2, ...FONTS.regular },

  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg },
  addBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  overviewRow: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: SPACING.lg
  },
  overviewCol: { alignItems: 'center' },
  overviewLabel: { fontSize: 10, color: '#666', ...FONTS.bold, marginBottom: 4 },
  overviewVal: { fontSize: 22, ...FONTS.bold, color: COLORS.primary },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: '#E5E7EB' },
  emptyTitle: { color: '#000', fontSize: FONTS.sizes.md, ...FONTS.bold, marginTop: 4 },
  emptySubtitle: { color: '#666', fontSize: FONTS.sizes.xs, textAlign: 'center', lineHeight: 18 },

  branchGrid: { gap: 14 },
  branchCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 18,
    borderWidth: 1, borderColor: '#E5E7EB', borderTopWidth: 4, borderTopColor: COLORS.primary
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  branchName: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000' },
  branchManager: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2, ...FONTS.medium },
  activeBadge: { backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.md },
  activeText: { fontSize: 10, color: COLORS.success, ...FONTS.bold },

  detailsGroup: { gap: 4, marginBottom: 14 },
  detailsText: { fontSize: FONTS.sizes.xs, color: '#666', ...FONTS.regular },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, padding: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  statVal: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: COLORS.primary },
  statLabel: { fontSize: 9, color: '#666', ...FONTS.bold, marginTop: 2 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  membersBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,122,0,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md },
  membersBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, ...FONTS.bold },
  iconActions: { flexDirection: 'row', gap: 6 },
  editBtn: { width: 32, height: 32, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  deleteBtn: { width: 32, height: 32, borderWidth: 1, borderColor: '#FEE2E2', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  doubleInputRow: { flexDirection: 'row', gap: 12 },
  submitBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.md },
  submitBtnText: { color: '#fff', fontSize: FONTS.sizes.md, ...FONTS.bold },

  // Members list modal
  modalBgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  membersModalContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 40, maxHeight: 400, padding: SPACING.lg },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  memberName: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: '#000' },
  memberPhone: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 1 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center', margin: 24 },
});
