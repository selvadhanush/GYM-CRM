import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, Alert, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/stores/auth';

const { width } = Dimensions.get('window');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const YEARS = [2025, 2026, 2027, 2028];

export default function ReportsScreen() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState<string | null>(null);

  // Picker modal states
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const handleDownloadReport = async (type: string) => {
    setDownloading(type);
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        Alert.alert('Authentication Error', 'You must be logged in to download reports.');
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const BASE_URL = API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api');

      const fileName = `${type}_report_${month}_${year}.csv`;
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
      const downloadUrl = `${BASE_URL}/reports/${type}?month=${month}&year=${year}`;

      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadResult.status !== 200) {
        throw new Error('Server returned non-200 status code.');
      }

      // Check if sharing is available
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert('Download Finished', `Report saved to: ${downloadResult.uri}`);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Export Failed', 'Unable to fetch the CSV report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Export Reports</Text>
          <Text style={styles.subtitle}>Select period to download CSV spreadsheets</Text>
        </View>

        {/* Input Parameters Box */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Configure Period</Text>

          <View style={styles.pickerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Month</Text>
              <TouchableOpacity style={styles.pickerSelector} onPress={() => setIsMonthPickerOpen(true)}>
                <Text style={styles.pickerSelectorText}>{MONTHS[month - 1]}</Text>
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Year</Text>
              <TouchableOpacity style={styles.pickerSelector} onPress={() => setIsYearPickerOpen(true)}>
                <Text style={styles.pickerSelectorText}>{year}</Text>
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Triggers List */}
        <View style={styles.actionsContainer}>
          {/* Revenue CSV */}
          <TouchableOpacity 
            style={[styles.reportBtn, { borderLeftColor: COLORS.primary }]}
            onPress={() => handleDownloadReport('revenue')}
            disabled={downloading !== null}
          >
            <View style={styles.reportBtnLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,122,0,0.1)' }]}>
                <Ionicons name="cash" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.reportBtnTitle}>Monthly Revenue Report</Text>
                <Text style={styles.reportBtnDesc}>CSV log of all received member payments</Text>
              </View>
            </View>
            {downloading === 'revenue' ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="download-outline" size={18} color="#666" />
            )}
          </TouchableOpacity>

          {/* Expenses CSV */}
          <TouchableOpacity 
            style={[styles.reportBtn, { borderLeftColor: COLORS.success }]}
            onPress={() => handleDownloadReport('expenses')}
            disabled={downloading !== null}
          >
            <View style={styles.reportBtnLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                <Ionicons name="trending-down" size={20} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.reportBtnTitle}>Monthly Expense Report</Text>
                <Text style={styles.reportBtnDesc}>CSV ledger of utility and rent payouts</Text>
              </View>
            </View>
            {downloading === 'expenses' ? (
              <ActivityIndicator size="small" color={COLORS.success} />
            ) : (
              <Ionicons name="download-outline" size={18} color="#666" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Filter Picker */}
      <Modal visible={isMonthPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsMonthPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Month</Text>
            {MONTHS.map((m, idx) => (
              <TouchableOpacity key={idx} style={styles.pickerOption} onPress={() => { setMonth(idx + 1); setIsMonthPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, month === idx + 1 && { color: COLORS.primary, fontWeight: 'bold' }]}>{m}</Text>
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
              <TouchableOpacity key={y} style={styles.pickerOption} onPress={() => { setYear(y); setIsYearPickerOpen(false); }}>
                <Text style={[styles.pickerOptionText, year === y && { color: COLORS.primary, fontWeight: 'bold' }]}>{y}</Text>
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
  content: { padding: SPACING.md, marginTop: 40 },
  header: { marginBottom: SPACING.xl },
  title: { fontSize: 24, ...FONTS.bold, color: '#000' },
  subtitle: { fontSize: FONTS.sizes.sm, color: '#666', marginTop: 2, ...FONTS.regular },

  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: SPACING.lg
  },
  cardLabel: { fontSize: FONTS.sizes.xs, ...FONTS.bold, color: '#444', marginBottom: 12 },
  pickerRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 10, color: '#888', ...FONTS.bold, marginBottom: 6 },
  pickerSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.lg, paddingHorizontal: 12, height: 42, backgroundColor: '#FAFAFA' },
  pickerSelectorText: { fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.medium },

  actionsContainer: { gap: 12 },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', borderLeftWidth: 5
  },
  reportBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  reportBtnTitle: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: '#000' },
  reportBtnDesc: { fontSize: 10, color: '#666', marginTop: 2, ...FONTS.regular },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 80, padding: SPACING.lg },
  pickerTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  pickerOptionText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },
});
