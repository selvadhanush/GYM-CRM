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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const YEARS = [2025, 2026, 2027, 2028];

export default function PayrollScreen() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'salary'>('history');
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Picker states for filters
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [isFilterTrainerPickerOpen, setIsFilterTrainerPickerOpen] = useState(false);

  // Modals state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);

  // Modal selector helpers
  const [isGenTrainerPickerOpen, setIsGenTrainerPickerOpen] = useState(false);
  const [isGenMonthPickerOpen, setIsGenMonthPickerOpen] = useState(false);
  const [isGenYearPickerOpen, setIsGenYearPickerOpen] = useState(false);
  const [isCommTrainerPickerOpen, setIsCommTrainerPickerOpen] = useState(false);

  // Form states
  const [configTrainer, setConfigTrainer] = useState<any | null>(null);
  const [salaryConfig, setSalaryConfig] = useState({ fixedSalary: '', commissionPt: '' });

  const [generateData, setGenerateData] = useState({
    trainerId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), incentives: '0'
  });

  const [commissionData, setCommissionData] = useState({
    trainerId: '', amount: '', date: new Date().toISOString().split('T')[0]
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchTrainers = async () => {
    try {
      const data = await adminService.getStaff();
      setTrainers(data.filter((s: any) => s.role === 'trainer') || []);
    } catch (err) {
      console.error('Error fetching trainers:', err);
    }
  };

  const fetchPayrollsData = async () => {
    setLoading(true);
    try {
      const params: any = {
        month: filterMonth,
        year: filterYear
      };
      if (selectedTrainerId) params.trainerId = selectedTrainerId;
      else if (!isAdmin) params.trainerId = user?._id || (user as any)?.id;

      const data = await adminService.getPayrolls(params);
      setPayrolls(data || []);
    } catch (err) {
      console.error('Error fetching payrolls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTrainers();
    } else {
      setSelectedTrainerId(user?._id || (user as any)?.id || '');
    }
  }, [user]);

  useEffect(() => {
    fetchPayrollsData();
  }, [selectedTrainerId, filterMonth, filterYear, activeTab]);

  const handleOpenConfigModal = async (trainer: any) => {
    setConfigTrainer(trainer);
    try {
      const structure = await adminService.getSalaryStructure(trainer._id);
      setSalaryConfig({
        fixedSalary: String(structure.fixedSalary || 0),
        commissionPt: String(structure.commissionPt || 0)
      });
      setIsConfigModalOpen(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load salary structure details.');
    }
  };

  const handleSaveConfig = async () => {
    if (!salaryConfig.fixedSalary || !salaryConfig.commissionPt) {
      Alert.alert('Validation Error', 'Please fill in both configurations.');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.upsertSalaryStructure({
        trainerId: configTrainer._id,
        fixedSalary: Number(salaryConfig.fixedSalary),
        commissionPt: Number(salaryConfig.commissionPt)
      });
      setIsConfigModalOpen(false);
      Alert.alert('Success', 'Salary structure settings saved.');
      fetchPayrollsData();
    } catch (err) {
      Alert.alert('Error', 'Failed to save configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!generateData.trainerId) {
      Alert.alert('Validation Error', 'Please select a trainer first.');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.generatePayroll({
        trainerId: generateData.trainerId,
        month: Number(generateData.month),
        year: Number(generateData.year),
        incentives: Number(generateData.incentives)
      });
      setIsGenerateModalOpen(false);
      Alert.alert('Success', 'Monthly payroll report compiled.');
      fetchPayrollsData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to compile payroll.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCommission = async () => {
    if (!commissionData.trainerId || !commissionData.amount) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.addCommission({
        trainerId: commissionData.trainerId,
        amount: Number(commissionData.amount),
        date: commissionData.date
      });
      setIsCommissionModalOpen(false);
      Alert.alert('Success', 'PT Commission recorded successfully.');
      fetchPayrollsData();
    } catch (err) {
      Alert.alert('Error', 'Failed to log commission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisburse = (payrollId: string) => {
    Alert.alert(
      'Disburse Salary',
      'Confirm salary payout? This will mark the monthly slip as PAID.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              await adminService.updatePayroll(payrollId, { status: 'Paid' });
              Alert.alert('Disbursed', 'Payroll status marked as paid.');
              fetchPayrollsData();
            } catch (err) {
              Alert.alert('Error', 'Failed to update disbursement status.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Payroll & Salary</Text>
            <Text style={styles.subtitle}>Disburse payouts & logs</Text>
          </View>
          {isAdmin && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => setIsCommissionModalOpen(true)}>
                <Ionicons name="add-circle-outline" size={14} color="#FFF" />
                <Text style={styles.headerBtnText}>Comm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: COLORS.primary }]} onPress={() => setIsGenerateModalOpen(true)}>
                <Ionicons name="flash-outline" size={14} color="#FFF" />
                <Text style={styles.headerBtnText}>Run</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tab Buttons */}
        {isAdmin && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'history' && styles.activeTabBtn]} 
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'history' && styles.activeTabBtnText]}>Payroll Logs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'salary' && styles.activeTabBtn]} 
              onPress={() => setActiveTab('salary')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'salary' && styles.activeTabBtnText]}>Salary Structures</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'history' ? (
          <View>
            {/* Filter Bar */}
            <View style={styles.filterCard}>
              {isAdmin && (
                <TouchableOpacity style={styles.filterSelector} onPress={() => setIsFilterTrainerPickerOpen(true)}>
                  <Text style={styles.filterSelectorText}>
                    {selectedTrainerId ? trainers.find(t => t._id === selectedTrainerId)?.name : 'All Trainers'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#666" />
                </TouchableOpacity>
              )}

              <View style={styles.doubleFilter}>
                <TouchableOpacity style={[styles.filterSelector, { flex: 1 }]} onPress={() => setIsMonthPickerOpen(true)}>
                  <Text style={styles.filterSelectorText}>{MONTHS[filterMonth - 1]}</Text>
                  <Ionicons name="chevron-down" size={14} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.filterSelector, { flex: 1 }]} onPress={() => setIsYearPickerOpen(true)}>
                  <Text style={styles.filterSelectorText}>{filterYear}</Text>
                  <Ionicons name="chevron-down" size={14} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pay Slips list */}
            <View style={styles.cardList}>
              <Text style={styles.sectionTitle}>Monthly Pay Slips</Text>

              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
              ) : payrolls.length === 0 ? (
                <Text style={styles.emptyText}>No payroll sheets logged for this period.</Text>
              ) : (
                payrolls.map((slip) => (
                  <View key={slip._id} style={styles.row}>
                    <View style={styles.rowLeft}>
                      {isAdmin && slip.trainer && (
                        <Text style={styles.slipTrainerName}>{slip.trainer.name}</Text>
                      )}
                      <Text style={styles.slipPeriod}>
                        Period: {MONTHS[slip.month - 1]} {slip.year}
                      </Text>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownText}>Fixed: ₹{slip.fixedSalary}</Text>
                        <Text style={styles.breakdownText}>PT Comm: ₹{slip.commissions}</Text>
                        <Text style={styles.breakdownText}>Bonus: ₹{slip.incentives}</Text>
                      </View>
                    </View>

                    <View style={styles.rowRight}>
                      <Text style={styles.slipTotal}>₹{slip.totalAmount.toLocaleString()}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: slip.status === 'Paid' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                        <Text style={[styles.statusText, { color: slip.status === 'Paid' ? COLORS.success : '#EF4444' }]}>
                          {slip.status}
                        </Text>
                      </View>
                      {isAdmin && slip.status !== 'Paid' && (
                        <TouchableOpacity style={styles.disburseBtn} onPress={() => handleDisburse(slip._id)}>
                          <Text style={styles.disburseBtnText}>Disburse</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
          <View style={styles.cardList}>
            <Text style={styles.sectionTitle}>Trainer Commissions Structures</Text>
            {trainers.map((t) => (
              <View key={t._id} style={styles.salaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.salaryTrainerName}>{t.name}</Text>
                  <Text style={styles.salaryTrainerEmail}>{t.email}</Text>
                </View>
                <TouchableOpacity style={styles.configBtn} onPress={() => handleOpenConfigModal(t)}>
                  <Ionicons name="settings-outline" size={14} color="#666" />
                  <Text style={styles.configBtnText}>Rates</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Salary Config Modal */}
      <Modal visible={isConfigModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Configure: {configTrainer?.name}</Text>
              <TouchableOpacity onPress={() => setIsConfigModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fixed Salary (₹ / month)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 25000"
                  value={salaryConfig.fixedSalary}
                  onChangeText={(txt) => setSalaryConfig({ ...salaryConfig, fixedSalary: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PT Commission (₹ / session completed)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 200"
                  value={salaryConfig.commissionPt}
                  onChangeText={(txt) => setSalaryConfig({ ...salaryConfig, commissionPt: txt })}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveConfig} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Configuration</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Generate Payroll Modal */}
      <Modal visible={isGenerateModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Run Payroll Engine</Text>
              <TouchableOpacity onPress={() => setIsGenerateModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Trainer *</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setIsGenTrainerPickerOpen(true)}>
                  <Text style={styles.selectorText}>
                    {generateData.trainerId ? trainers.find(t => t._id === generateData.trainerId)?.name : 'Choose Trainer...'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.doubleInputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Month *</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setIsGenMonthPickerOpen(true)}>
                    <Text style={styles.selectorText}>{MONTHS[generateData.month - 1]}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Year *</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setIsGenYearPickerOpen(true)}>
                    <Text style={styles.selectorText}>{generateData.year}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bonus / Performance Incentives (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 1500"
                  value={generateData.incentives}
                  onChangeText={(txt) => setGenerateData({ ...generateData, incentives: txt })}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleGeneratePayroll} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Generate & Log Payroll</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Log Commission Modal */}
      <Modal visible={isCommissionModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log PT Commission</Text>
              <TouchableOpacity onPress={() => setIsCommissionModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Trainer *</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setIsCommTrainerPickerOpen(true)}>
                  <Text style={styles.selectorText}>
                    {commissionData.trainerId ? trainers.find(t => t._id === commissionData.trainerId)?.name : 'Choose Trainer...'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Commission Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 800"
                  value={commissionData.amount}
                  onChangeText={(txt) => setCommissionData({ ...commissionData, amount: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2026-06-25"
                  value={commissionData.date}
                  onChangeText={(txt) => setCommissionData({ ...commissionData, date: txt })}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddCommission} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Commission Log</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* FILTER PICKERS */}
      {/* Month Filter Picker */}
      <Modal visible={isMonthPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsMonthPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Month</Text>
            {MONTHS.map((m, idx) => (
              <TouchableOpacity key={idx} style={styles.pickerOption} onPress={() => { setFilterMonth(idx + 1); setIsMonthPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, filterMonth === idx + 1 && { color: COLORS.primary, fontWeight: 'bold' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Filter Picker */}
      <Modal visible={isYearPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsYearPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Year</Text>
            {YEARS.map((y) => (
              <TouchableOpacity key={y} style={styles.pickerOption} onPress={() => { setFilterYear(y); setIsYearPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, filterYear === y && { color: COLORS.primary, fontWeight: 'bold' }]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Trainer Filter Picker */}
      <Modal visible={isFilterTrainerPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsFilterTrainerPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Trainer</Text>
            <TouchableOpacity style={styles.pickerOption} onPress={() => { setSelectedTrainerId(''); setIsFilterTrainerPickerOpen(false); }}>
              <Text style={[styles.pickerOptionText, selectedTrainerId === '' && { color: COLORS.primary, fontWeight: 'bold' }]}>All Trainers</Text>
            </TouchableOpacity>
            {trainers.map((t) => (
              <TouchableOpacity key={t._id} style={styles.pickerOption} onPress={() => { setSelectedTrainerId(t._id); setIsFilterTrainerPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, selectedTrainerId === t._id && { color: COLORS.primary, fontWeight: 'bold' }]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GEN TRAINER PICKER */}
      <Modal visible={isGenTrainerPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsGenTrainerPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Trainer</Text>
            {trainers.map((t) => (
              <TouchableOpacity key={t._id} style={styles.pickerOption} onPress={() => { setGenerateData({ ...generateData, trainerId: t._id }); setIsGenTrainerPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, generateData.trainerId === t._id && { color: COLORS.primary, fontWeight: 'bold' }]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GEN MONTH PICKER */}
      <Modal visible={isGenMonthPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsGenMonthPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Month</Text>
            {MONTHS.map((m, idx) => (
              <TouchableOpacity key={idx} style={styles.pickerOption} onPress={() => { setGenerateData({ ...generateData, month: idx + 1 }); setIsGenMonthPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, generateData.month === idx + 1 && { color: COLORS.primary, fontWeight: 'bold' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GEN YEAR PICKER */}
      <Modal visible={isGenYearPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsGenYearPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Year</Text>
            {YEARS.map((y) => (
              <TouchableOpacity key={y} style={styles.pickerOption} onPress={() => { setGenerateData({ ...generateData, year: y }); setIsGenYearPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, generateData.year === y && { color: COLORS.primary, fontWeight: 'bold' }]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* COMM TRAINER PICKER */}
      <Modal visible={isCommTrainerPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsCommTrainerPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Trainer</Text>
            {trainers.map((t) => (
              <TouchableOpacity key={t._id} style={styles.pickerOption} onPress={() => { setCommissionData({ ...commissionData, trainerId: t._id }); setIsCommTrainerPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, commissionData.trainerId === t._id && { color: COLORS.primary, fontWeight: 'bold' }]}>{t.name}</Text>
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

  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg },
  headerBtnText: { color: '#fff', fontSize: 11, ...FONTS.bold },

  tabsContainer: { flexDirection: 'row', gap: 10, marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTabBtn: { borderBottomColor: COLORS.primary },
  tabBtnText: { fontSize: FONTS.sizes.sm, color: '#666', ...FONTS.semibold },
  activeTabBtnText: { color: COLORS.primary },

  filterCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 12, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: '#E5E7EB', gap: 10
  },
  filterSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.lg, paddingHorizontal: 12, height: 40, backgroundColor: '#FAFAFA' },
  filterSelectorText: { fontSize: FONTS.sizes.sm, color: '#444', ...FONTS.medium },
  doubleFilter: { flexDirection: 'row', gap: 10 },

  cardList: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  sectionTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center', margin: 24 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLeft: { flex: 1 },
  slipTrainerName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  slipPeriod: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2, ...FONTS.medium },
  breakdownRow: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  breakdownText: { fontSize: 10, color: '#888', ...FONTS.semibold },

  rowRight: { alignItems: 'flex-end', gap: 4 },
  slipTotal: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: COLORS.primary },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.md, marginTop: 2 },
  statusText: { fontSize: 9, ...FONTS.bold },
  disburseBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.md, marginTop: 4 },
  disburseBtnText: { color: '#fff', fontSize: 10, ...FONTS.bold },

  salaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  salaryTrainerName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  salaryTrainerEmail: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2 },
  configBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F9FAFB' },
  configBtnText: { fontSize: 11, color: '#444', ...FONTS.bold },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  doubleInputRow: { flexDirection: 'row', gap: 12 },
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
