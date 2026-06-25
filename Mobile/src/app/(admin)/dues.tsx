import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';

const { width } = Dimensions.get('window');

export default function DuesScreen() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isMethodPickerOpen, setIsMethodPickerOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });

  const paymentMethods = ['Cash', 'UPI', 'Card'];

  const fetchDues = async () => {
    try {
      setLoading(true);
      // Fetch members and filter for due amount > 0
      const data = await adminService.getMembers(1, 100, '');
      const membersWithDues = (data.members || []).filter(
        (m: any) => (m.planPrice - m.paidAmount) > 0
      );
      setMembers(membersWithDues);
    } catch (error) {
      console.error('Error fetching dues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const openPaymentModal = (member: any) => {
    setSelectedMember(member);
    const balance = member.planPrice - member.paidAmount;
    setPaymentData({
      amount: String(balance),
      method: 'Cash',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handlePayment = async () => {
    if (!paymentData.amount.trim()) {
      Alert.alert('Validation Error', 'Please enter a payment amount.');
      return;
    }
    const enteredVal = Number(paymentData.amount);
    const balance = selectedMember.planPrice - selectedMember.paidAmount;
    if (enteredVal <= 0) {
      Alert.alert('Validation Error', 'Amount must be greater than zero.');
      return;
    }
    if (enteredVal > balance) {
      Alert.alert('Validation Error', `Amount cannot exceed the balance due of ₹${balance}.`);
      return;
    }

    try {
      await adminService.createPayment({
        memberId: selectedMember._id,
        amount: enteredVal,
        method: paymentData.method,
        date: paymentData.date
      });
      setShowModal(false);
      fetchDues();
      Alert.alert('Success', 'Payment recorded successfully, member balance updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment.');
    }
  };

  const totalDuesAmount = members.reduce((sum, m) => sum + (m.planPrice - m.paidAmount), 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Due Management</Text>
            <Text style={styles.subtitle}>Collect unpaid membership fees</Text>
          </View>
        </View>

        {/* Due Stats Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryTitle}>Total Outstanding Dues</Text>
              <Text style={styles.summaryVal}>₹{totalDuesAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{members.length} Members</Text>
            </View>
          </View>
        </View>

        {/* Dues List */}
        <View style={styles.cardList}>
          <Text style={styles.sectionTitle}>Defaulters List</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
          ) : members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={40} color={COLORS.success} />
              <Text style={styles.emptyText}>All dues are clear! No outstanding balances.</Text>
            </View>
          ) : (
            members.map((member) => {
              const balance = member.planPrice - member.paidAmount;
              return (
                <View key={member._id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowMemberName}>{member.name}</Text>
                    <Text style={styles.rowPhone}>{member.phone}</Text>
                    
                    <View style={styles.statsBreakdown}>
                      <Text style={styles.breakdownText}>Plan: ₹{member.planPrice}</Text>
                      <Text style={[styles.breakdownText, { color: COLORS.success }]}>Paid: ₹{member.paidAmount}</Text>
                    </View>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.dueVal}>₹{balance.toLocaleString('en-IN')}</Text>
                    <TouchableOpacity 
                      style={styles.collectBtn} 
                      onPress={() => openPaymentModal(member)}
                    >
                      <Text style={styles.collectBtnText}>Collect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Collect Payment Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Collect: {selectedMember?.name}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={styles.dueAlert}>
                  <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                  <Text style={styles.dueAlertText}>
                    Outstanding Balance: ₹{(selectedMember.planPrice - selectedMember.paidAmount).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount to Pay (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="Enter amount..."
                    value={paymentData.amount}
                    onChangeText={(txt) => setPaymentData({ ...paymentData, amount: txt })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Method *</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setIsMethodPickerOpen(true)}>
                    <Text style={styles.selectorText}>{paymentData.method}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handlePayment}>
                  <Text style={styles.submitBtnText}>Confirm Payment Collection</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Method Picker Modal */}
      <Modal visible={isMethodPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsMethodPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Method</Text>
            {paymentMethods.map((m) => (
              <TouchableOpacity 
                key={m} 
                style={styles.pickerOption} 
                onPress={() => { setPaymentData({ ...paymentData, method: m }); setIsMethodPickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, paymentData.method === m && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {m}
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

  summaryCard: {
    backgroundColor: '#FFF', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontSize: FONTS.sizes.xs, color: '#666', ...FONTS.medium, textTransform: 'uppercase' },
  summaryVal: { fontSize: 32, ...FONTS.bold, color: '#EF4444', marginTop: 4, letterSpacing: -1 },
  badgeCount: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  badgeText: { fontSize: 11, color: '#EF4444', ...FONTS.bold },

  cardList: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  sectionTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },

  emptyContainer: { padding: 32, alignItems: 'center', gap: 8 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLeft: { flex: 1 },
  rowMemberName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  rowPhone: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2, ...FONTS.regular },
  statsBreakdown: { flexDirection: 'row', gap: 12, marginTop: 4 },
  breakdownText: { fontSize: 10, color: '#888', ...FONTS.semibold },

  rowRight: { alignItems: 'flex-end', gap: 8 },
  dueVal: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: '#EF4444' },
  collectBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md },
  collectBtnText: { color: '#fff', fontSize: 11, ...FONTS.bold },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },

  dueAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,122,0,0.08)', padding: 12, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  dueAlertText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, ...FONTS.bold },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

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
