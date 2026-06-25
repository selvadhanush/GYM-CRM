import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';

const { width } = Dimensions.get('window');

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Rent', 'Electricity', 'Maintenance', 'Salaries', 'Equipment', 'Marketing', 'Others'];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await adminService.getExpenses();
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.amount.trim() || !formData.category) {
      Alert.alert('Validation Error', 'Please fill in Title, Amount, and Category.');
      return;
    }

    try {
      await adminService.createExpense({
        ...formData,
        amount: Number(formData.amount)
      });
      setShowModal(false);
      setFormData({
        title: '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
      Alert.alert('Success', 'Expense logged successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create expense.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteExpense(id);
              fetchExpenses();
              Alert.alert('Success', 'Expense record deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense.');
            }
          }
        }
      ]
    );
  };

  // Calculate total expense amount
  const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Expenses</Text>
            <Text style={styles.subtitle}>Track and manage operational costs</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.exportBtn} 
              onPress={() => router.push('/(admin)/reports')}
            >
              <Ionicons name="bar-chart" size={16} color={COLORS.primary} />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Expenses</Text>
          <Text style={styles.summaryVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySub}>{expenses.length} transactions logged</Text>
        </View>

        {/* Expenses List */}
        <View style={styles.cardList}>
          <Text style={styles.sectionTitle}>Transactions Log</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
          ) : expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No expenses recorded yet.</Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <View key={expense._id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle}>{expense.title}</Text>
                  <View style={styles.rowDetails}>
                    <Text style={styles.rowDate}>
                      {new Date(expense.date).toLocaleDateString('en-IN')}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{expense.category}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>- ₹{expense.amount.toLocaleString('en-IN')}</Text>
                  <TouchableOpacity onPress={() => handleDelete(expense._id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Monthly Rent"
                  value={formData.title}
                  onChangeText={(txt) => setFormData({ ...formData, title: txt })}
                />
              </View>

              <View style={styles.doubleGroup}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={formData.amount}
                    onChangeText={(txt) => setFormData({ ...formData, amount: txt })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    value={formData.date}
                    onChangeText={(txt) => setFormData({ ...formData, date: txt })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setIsCategoryPickerOpen(true)}>
                  <Text style={styles.selectorText}>{formData.category || 'Select Category'}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 80 }]}
                  multiline
                  placeholder="Notes or description..."
                  value={formData.description}
                  onChangeText={(txt) => setFormData({ ...formData, description: txt })}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Save Expense</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Category Dropdown Modal */}
      <Modal visible={isCategoryPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsCategoryPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Category</Text>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat} 
                style={styles.pickerOption} 
                onPress={() => { setFormData({ ...formData, category: cat }); setIsCategoryPickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, formData.category === cat && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {cat}
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

  actions: { flexDirection: 'row', gap: 8 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,122,0,0.06)' },
  exportBtnText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, ...FONTS.bold },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  summaryCard: {
    backgroundColor: '#FFF', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  summaryTitle: { fontSize: FONTS.sizes.xs, color: '#666', ...FONTS.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryVal: { fontSize: 32, ...FONTS.bold, color: '#EF4444', marginVertical: 6, letterSpacing: -1 },
  summarySub: { fontSize: FONTS.sizes.xs, color: '#888', ...FONTS.regular },

  cardList: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  sectionTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },

  emptyContainer: { padding: 32, alignItems: 'center', gap: 8 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  rowDetails: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  rowDate: { fontSize: 11, color: '#666', ...FONTS.regular },
  categoryBadge: { backgroundColor: 'rgba(255,122,0,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.md },
  categoryText: { fontSize: 9, color: COLORS.primary, ...FONTS.bold },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowAmount: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: '#EF4444' },
  deleteBtn: { padding: 4 },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  doubleGroup: { flexDirection: 'row', gap: SPACING.sm },
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
