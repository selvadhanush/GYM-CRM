import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, FlatList, Modal, Alert, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';
import type { Member } from '@/types';

const { width } = Dimensions.get('window');

export default function PaymentsScreen() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberPayments, setSelectedMemberPayments] = useState<{ memberName: string; history: any[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Search state for member selection in modal
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ memberId: '', amount: '', method: 'Cash' });
  const [isMethodPickerOpen, setIsMethodPickerOpen] = useState(false);

  const paymentMethods = ['Cash', 'UPI', 'Card'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsData, membersData] = await Promise.all([
        adminService.getPaymentsList(),
        adminService.getMembers(1, 100, '') // fetch up to 100 members for lookup
      ]);
      setPayments(paymentsData || []);
      setMembers(membersData.members || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPayment = async () => {
    if (!formData.memberId || !formData.amount.trim() || !formData.method) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    try {
      await adminService.createPayment({
        ...formData,
        amount: Number(formData.amount)
      });
      setIsModalOpen(false);
      setFormData({ memberId: '', amount: '', method: 'Cash' });
      setSelectedMember(null);
      setSearchQuery('');
      fetchData();
      Alert.alert('Success', 'Payment recorded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const viewHistory = async (memberId: string, memberName: string) => {
    if (!memberId) return;
    try {
      setHistoryLoading(true);
      setSelectedMemberPayments({ memberName, history: [] });
      const history = await adminService.getMemberPayments(memberId);
      setSelectedMemberPayments({ memberName, history: history || [] });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch member payment history');
      setSelectedMemberPayments(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredMembersForLookup = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Payments</Text>
            <Text style={styles.subtitle}>Log manual membership payments</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.exportBtn} 
              onPress={() => router.push('/(admin)/reports')}
            >
              <Ionicons name="bar-chart" size={16} color={COLORS.primary} />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
              <Text style={styles.addBtnText}>+ Record</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payments List */}
        <View style={styles.cardList}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
          ) : payments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No payments logged yet.</Text>
            </View>
          ) : (
            [...payments].reverse().map((payment) => (
              <View key={payment._id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowMemberName}>
                    {payment.memberId?.name || 'Deleted Member'}
                  </Text>
                  <View style={styles.rowDetails}>
                    <Text style={styles.rowDate}>
                      {new Date(payment.date).toLocaleDateString('en-IN')}
                    </Text>
                    <View style={styles.methodBadge}>
                      <Text style={styles.methodText}>{payment.method}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>+ ₹{(payment.amount || 0).toLocaleString('en-IN')}</Text>
                  <TouchableOpacity 
                    style={styles.historyBtn} 
                    onPress={() => viewHistory(payment.memberId?._id, payment.memberId?.name || 'Member')}
                  >
                    <Text style={styles.historyBtnText}>History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record New Payment</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Member Search input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Member *</Text>
                <View style={styles.searchWrapper}>
                  <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search member by name or phone..."
                    value={searchQuery}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    onChangeText={(txt) => {
                      setSearchQuery(txt);
                      setIsSearchDropdownOpen(true);
                    }}
                  />
                  {searchQuery !== '' && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedMember(null); setFormData({ ...formData, memberId: '' }); }}>
                      <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Dropdown overlay */}
                {isSearchDropdownOpen && searchQuery !== '' && (
                  <View style={styles.dropdown}>
                    {filteredMembersForLookup.length === 0 ? (
                      <Text style={styles.emptySearch}>No members found</Text>
                    ) : (
                      filteredMembersForLookup.slice(0, 4).map((m) => (
                        <TouchableOpacity 
                          key={m._id} 
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedMember(m);
                            setSearchQuery(`${m.name} (${m.phone})`);
                            setFormData({ ...formData, memberId: m._id });
                            setIsSearchDropdownOpen(false);
                          }}
                        >
                          <View>
                            <Text style={styles.dropName}>{m.name}</Text>
                            <Text style={styles.dropPhone}>{m.phone}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={formData.amount}
                  onChangeText={(txt) => setFormData({ ...formData, amount: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method *</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setIsMethodPickerOpen(true)}>
                  <Text style={styles.selectorText}>{formData.method}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddPayment}>
                <Text style={styles.submitBtnText}>Submit Payment</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Method Picker Dropdown Modal */}
      <Modal visible={isMethodPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsMethodPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Method</Text>
            {paymentMethods.map((m) => (
              <TouchableOpacity 
                key={m} 
                style={styles.pickerOption} 
                onPress={() => { setFormData({ ...formData, method: m }); setIsMethodPickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, formData.method === m && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payment History Modal */}
      {selectedMemberPayments && (
        <Modal 
          animationType="fade" 
          transparent={true} 
          visible={!!selectedMemberPayments}
          onRequestClose={() => setSelectedMemberPayments(null)}
        >
          <View style={styles.modalBgOverlay}>
            <View style={styles.historyModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  History: {selectedMemberPayments.memberName}
                </Text>
                <TouchableOpacity onPress={() => setSelectedMemberPayments(null)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {historyLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ margin: 40 }} />
              ) : selectedMemberPayments.history.length === 0 ? (
                <Text style={styles.emptySearch}>No payments records found.</Text>
              ) : (
                <FlatList
                  data={selectedMemberPayments.history}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.historyRow}>
                      <View>
                        <Text style={styles.historyDate}>
                          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                        <Text style={styles.historyMethod}>{item.method}</Text>
                      </View>
                      <Text style={styles.historyAmount}>₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
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

  actions: { flexDirection: 'row', gap: 8 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,122,0,0.06)' },
  exportBtnText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, ...FONTS.bold },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  cardList: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  sectionTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },

  emptyContainer: { padding: 32, alignItems: 'center', gap: 8 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLeft: { flex: 1 },
  rowMemberName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  rowDetails: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  rowDate: { fontSize: 11, color: '#666', ...FONTS.regular },
  methodBadge: { backgroundColor: 'rgba(34,197,94,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.md },
  methodText: { fontSize: 9, color: COLORS.success, ...FONTS.bold },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowAmount: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: COLORS.success },
  historyBtn: { borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md },
  historyBtnText: { fontSize: 11, color: '#444', ...FONTS.medium },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: RADIUS.md, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  dropdown: { backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 4, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  dropPhone: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 1 },
  emptySearch: { padding: 16, textAlign: 'center', color: '#666', fontSize: FONTS.sizes.sm },

  selector: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' },
  selectorText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },

  submitBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.md },
  submitBtnText: { color: '#fff', fontSize: FONTS.sizes.md, ...FONTS.bold },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 80, padding: SPACING.lg },
  pickerTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  pickerOptionText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },

  // History modal
  modalBgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  historyModalContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 40, maxHeight: 400, padding: SPACING.lg },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  historyDate: { fontSize: FONTS.sizes.sm, color: '#222', ...FONTS.semibold },
  historyMethod: { fontSize: 10, color: '#666', marginTop: 2, ...FONTS.medium },
  historyAmount: { fontSize: FONTS.sizes.sm, color: COLORS.success, ...FONTS.bold },
});
