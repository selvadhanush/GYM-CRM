import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';

const { width } = Dimensions.get('window');

const ROLES = ['trainer', 'receptionist', 'admin'];

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  trainer: '#6366F1',
  receptionist: '#F59E0B'
};

export default function StaffScreen() {
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
  const [isFilterRolePickerOpen, setIsFilterRolePickerOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'trainer'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStaff();
      setStaffList(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenModal = (staff: any = null) => {
    setShowPassword(false);
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        email: staff.email,
        password: '',
        role: staff.role
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '', email: '', password: '', role: 'trainer'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter Name and Email Address.');
      return;
    }
    if (!editingStaff && !formData.password.trim()) {
      Alert.alert('Validation Error', 'Password is required for new accounts.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingStaff) {
        const payload: any = { ...formData };
        if (!payload.password.trim()) {
          delete payload.password;
        }
        await adminService.updateStaff(editingStaff._id, payload);
        Alert.alert('Success', 'Staff details updated.');
      } else {
        await adminService.createStaff(formData);
        Alert.alert('Success', 'Staff account created.');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (staffMember: any) => {
    const isSelf = staffMember._id === user?._id || staffMember.id === (user as any)?.id;
    if (isSelf) {
      Alert.alert('Action Blocked', 'You cannot delete your own logged-in administrator account.');
      return;
    }

    Alert.alert(
      'Remove Staff',
      `Are you sure you want to remove ${staffMember.name} from the gym system?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteStaff(staffMember._id);
              fetchStaff();
              Alert.alert('Deleted', 'Account removed successfully.');
            } catch (err) {
              Alert.alert('Error', 'Failed to remove staff member.');
            }
          }
        }
      ]
    );
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? s.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Staff & Trainers</Text>
            <Text style={styles.subtitle}>Manage gym personnel accounts</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
            <Text style={styles.addBtnText}>+ Add Staff</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Card */}
        <View style={styles.filterCard}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={16} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={search}
              onChangeText={(txt) => setSearch(txt)}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.roleFilterBtn} onPress={() => setIsFilterRolePickerOpen(true)}>
            <Ionicons name="filter-outline" size={14} color="#555" />
            <Text style={styles.roleFilterBtnText}>
              {roleFilter ? `Role: ${roleFilter}` : 'Filter: All Roles'}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Staff list */}
        <View style={styles.cardList}>
          <Text style={styles.sectionTitle}>Gym Employees</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
          ) : filteredStaff.length === 0 ? (
            <Text style={styles.emptyText}>No staff members found matching search filters.</Text>
          ) : (
            filteredStaff.map((staff) => {
              const badgeColor = ROLE_COLORS[staff.role] || '#666';
              const isSelf = staff._id === user?._id || staff.id === (user as any)?.id;

              return (
                <View key={staff._id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.rowName}>{staff.name}</Text>
                      {isSelf && (
                        <View style={styles.selfPill}>
                          <Text style={styles.selfText}>You</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowEmail}>{staff.email}</Text>
                    <Text style={styles.rowJoined}>
                      Joined: {new Date(staff.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.rowRight}>
                    <View style={[styles.roleBadge, { backgroundColor: `${badgeColor}12` }]}>
                      <Text style={[styles.roleText, { color: badgeColor }]}>{staff.role}</Text>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenModal(staff)}>
                        <Ionicons name="pencil-outline" size={14} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.deleteBtn, isSelf && { opacity: 0.3 }]} 
                        disabled={isSelf}
                        onPress={() => handleDelete(staff)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add / Edit Staff Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {editingStaff ? `Edit Staff: ${editingStaff.name}` : 'Create Staff Member'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChangeText={(txt) => setFormData({ ...formData, name: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChangeText={(txt) => setFormData({ ...formData, email: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {editingStaff ? 'New Password (optional)' : 'Password *'}
                </Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholder={editingStaff ? 'Leave blank to keep' : 'Enter login password...'}
                    value={formData.password}
                    onChangeText={(txt) => setFormData({ ...formData, password: txt })}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={18} 
                      color="#888" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>System Role *</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setIsRolePickerOpen(true)}>
                  <Text style={styles.selectorText}>{formData.role}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingStaff ? 'Save Changes' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Role Selector Modal */}
      <Modal visible={isRolePickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsRolePickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Role</Text>
            {ROLES.map((r) => (
              <TouchableOpacity 
                key={r} 
                style={styles.pickerOption} 
                onPress={() => { setFormData({ ...formData, role: r }); setIsRolePickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, formData.role === r && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Role Selector Modal */}
      <Modal visible={isFilterRolePickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsFilterRolePickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Filter by Role</Text>
            <TouchableOpacity 
              style={styles.pickerOption} 
              onPress={() => { setRoleFilter(''); setIsFilterRolePickerOpen(false); }}
            >
              <Text style={[styles.pickerOptionText, roleFilter === '' && { color: COLORS.primary, fontWeight: 'bold' }]}>
                All Roles
              </Text>
            </TouchableOpacity>
            {ROLES.map((r) => (
              <TouchableOpacity 
                key={r} 
                style={styles.pickerOption} 
                onPress={() => { setRoleFilter(r); setIsFilterRolePickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, roleFilter === r && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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

  filterCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 12, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: '#E5E7EB', gap: 10
  },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: RADIUS.lg, paddingHorizontal: 10, height: 40 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: '100%', fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },
  roleFilterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.lg, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FAFAFA' },
  roleFilterBtnText: { fontSize: 11, color: '#444', ...FONTS.bold },

  cardList: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  sectionTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center', margin: 24 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLeft: { flex: 1 },
  rowName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  selfPill: { backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.md },
  selfText: { fontSize: 9, color: COLORS.success, ...FONTS.bold },
  rowEmail: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2 },
  rowJoined: { fontSize: 10, color: '#888', marginTop: 4, ...FONTS.semibold },

  rowRight: { alignItems: 'flex-end', gap: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  roleText: { fontSize: 9, ...FONTS.bold, textTransform: 'uppercase' },

  actionButtons: { flexDirection: 'row', gap: 6, marginTop: 4 },
  editBtn: { width: 28, height: 28, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  deleteBtn: { width: 28, height: 28, borderWidth: 1, borderColor: '#FEE2E2', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  passwordWrapper: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' },
  passwordInput: { flex: 1, height: '100%', fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  selector: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' },
  selectorText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },

  submitBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.md },
  submitBtnText: { color: '#fff', fontSize: FONTS.sizes.md, ...FONTS.bold },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 80, padding: SPACING.lg },
  pickerTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  pickerOptionText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },
});
