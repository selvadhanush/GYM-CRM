import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, FlatList, Modal, Platform, Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';
import type { Member, Attendance } from '@/types';

const { width } = Dimensions.get('window');

export default function AttendanceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [members, setMembers] = useState<Member[]>([]);
  const [todayList, setTodayList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [selectedMemberHistory, setSelectedMemberHistory] = useState<{ memberName: string; history: any[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [torch, setTorch] = useState(false);

  const scanLock = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch active members and today's attendance
      const [membersData, attendanceData] = await Promise.all([
        adminService.getMembers(1, 100, searchQuery), // paginated but request top 100 for manual check-in
        adminService.getTodayAttendance()
      ]);
      setMembers(membersData.members || []);
      setTodayList(attendanceData || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAttendance = async (memberId: string) => {
    if (!memberId) return;
    try {
      await adminService.markAttendance(memberId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessage({ text: 'Attendance marked successfully!', type: 'success' });
      setSelectedMember(null);
      setSearchQuery('');
      setIsScannerOpen(false);
      fetchData();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMessage({ text: error?.message || 'Error marking attendance', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let parsedMemberId = data;
    try {
      const p = JSON.parse(data);
      parsedMemberId = p.memberId || p.id || data;
    } catch {
      // fallback to raw data string
    }

    handleMarkAttendance(parsedMemberId);
    setTimeout(() => {
      scanLock.current = false;
    }, 2000);
  };

  const viewHistory = async (memberId: string, memberName: string) => {
    try {
      setHistoryLoading(true);
      setSelectedMemberHistory({ memberName, history: [] });
      const history = await adminService.getMemberAttendance(memberId);
      setSelectedMemberHistory({ memberName, history: history || [] });
    } catch (error) {
      alert('Error fetching attendance history');
      setSelectedMemberHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Tracking</Text>
        <Text style={styles.subtitle}>Check in members manually or by QR scanning</Text>
      </View>

      {/* Message Banner */}
      {message.text !== '' && (
        <View style={[
          styles.msgBanner,
          { backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }
        ]}>
          <Ionicons 
            name={message.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color={message.type === 'success' ? COLORS.success : '#EF4444'} 
          />
          <Text style={[
            styles.msgText,
            { color: message.type === 'success' ? COLORS.success : '#EF4444' }
          ]}>
            {message.text}
          </Text>
        </View>
      )}

      {/* Main Grid Options */}
      <View style={styles.grid}>
        {/* Manual Check-in Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Manual Check-In</Text>
          <Text style={styles.cardDesc}>Search and select member by name or phone</Text>

          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search active member..."
              value={searchQuery}
              onFocus={() => setIsSearchDropdownOpen(true)}
              onChangeText={(txt) => {
                setSearchQuery(txt);
                setIsSearchDropdownOpen(true);
              }}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedMember(null); }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Dropdown Panel */}
          {isSearchDropdownOpen && searchQuery !== '' && (
            <View style={styles.dropdown}>
              {filteredMembers.length === 0 ? (
                <Text style={styles.emptySearch}>No active members found</Text>
              ) : (
                filteredMembers.slice(0, 5).map((m) => (
                  <TouchableOpacity 
                    key={m._id} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedMember(m);
                      setSearchQuery(`${m.name} (${m.phone})`);
                      setIsSearchDropdownOpen(false);
                    }}
                  >
                    <View>
                      <Text style={styles.dropName}>{m.name}</Text>
                      <Text style={styles.dropPhone}>{m.phone}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.btn, !selectedMember && styles.btnDisabled]}
            disabled={!selectedMember}
            onPress={() => selectedMember && handleMarkAttendance(selectedMember._id)}
          >
            <Text style={styles.btnText}>Mark Check-In</Text>
          </TouchableOpacity>
        </View>

        {/* QR Attendance Card */}
        <View style={[styles.card, styles.centerCard]}>
          <View style={styles.qrIconWrap}>
            <Ionicons name="qr-code" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.cardTitle}>Scan Member QR</Text>
          <Text style={[styles.cardDesc, { textAlign: 'center' }]}>
            Use device camera to scan member check-in QR codes automatically
          </Text>

          <TouchableOpacity 
            style={styles.scanBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (!permission?.granted) {
                requestPermission();
              } else {
                setIsScannerOpen(true);
              }
            }}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.scanBtnGrad}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.scanBtnText}>Open QR Scanner</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Attendance List */}
      <View style={styles.cardFull}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Today's Attendance</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{todayList.length} Checked In</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
        ) : todayList.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyText}>No attendance records marked today.</Text>
          </View>
        ) : (
          todayList.map((item, idx) => (
            <View key={item._id || idx} style={styles.attendRow}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.memberId?.name || 'Unknown Member'}</Text>
                <Text style={styles.rowPhone}>{item.memberId?.phone || 'No Phone'}</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={styles.timeTag}>
                  <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                  <Text style={styles.timeText}>{item.checkInTime}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.historyBtn}
                  onPress={() => viewHistory(item.memberId?._id, item.memberId?.name)}
                >
                  <Text style={styles.historyBtnText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* QR Scanner Camera Overlay Modal */}
      {isScannerOpen && (
        <Modal animationType="slide" transparent={false} visible={isScannerOpen}>
          <View style={styles.scannerContainer}>
            <CameraView 
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarCodeScanned}
              enableTorch={torch}
            >
              <View style={styles.scannerOverlay}>
                <Text style={styles.scanTitle}>Scan Member QR Code</Text>
                <View style={styles.scanTarget}>
                  {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
                    <View key={i} style={[styles.corner, pos,
                      i < 2 ? { borderTopWidth: 3 } : { borderBottomWidth: 3 },
                      i % 2 === 0 ? { borderLeftWidth: 3 } : { borderRightWidth: 3 },
                    ]} />
                  ))}
                </View>
                <Text style={styles.scanSubtitle}>Position the QR inside the frame</Text>
              </View>
            </CameraView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsScannerOpen(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(!torch)}>
              <Ionicons name={torch ? "flash" : "flash-off"} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Attendance History Modal */}
      {selectedMemberHistory && (
        <Modal 
          animationType="fade" 
          transparent={true} 
          visible={!!selectedMemberHistory}
          onRequestClose={() => setSelectedMemberHistory(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  History: {selectedMemberHistory.memberName}
                </Text>
                <TouchableOpacity onPress={() => setSelectedMemberHistory(null)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {historyLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ margin: 40 }} />
              ) : selectedMemberHistory.history.length === 0 ? (
                <Text style={styles.emptyModal}>No attendance records found.</Text>
              ) : (
                <FlatList
                  data={selectedMemberHistory.history}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  renderItem={({ item }) => (
                    <View style={styles.historyRow}>
                      <Text style={styles.historyDate}>
                        {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                      <View style={styles.historyTimeTag}>
                        <Text style={styles.historyTimeText}>{item.checkInTime}</Text>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: SPACING.md, paddingBottom: 100 },
  header: { marginBottom: SPACING.lg, marginTop: 40 },
  title: { fontSize: 24, ...FONTS.bold, color: '#000' },
  subtitle: { fontSize: FONTS.sizes.sm, color: '#666', marginTop: 2, ...FONTS.regular },

  msgBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg,
  },
  msgText: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, flex: 1 },

  grid: { gap: SPACING.md, marginBottom: SPACING.lg },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1
  },
  centerCard: { alignItems: 'center' },
  cardTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: 4 },
  cardDesc: { fontSize: FONTS.sizes.xs, color: '#666', ...FONTS.regular, marginBottom: SPACING.md },

  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.md, paddingHorizontal: 12, height: 44, marginBottom: SPACING.md
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  dropdown: {
    backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E5E7EB',
    marginBottom: SPACING.md, overflow: 'hidden'
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  dropName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  dropPhone: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 1 },
  emptySearch: { padding: 16, textAlign: 'center', color: '#666', fontSize: FONTS.sizes.sm },

  btn: {
    backgroundColor: COLORS.primary, height: 44, borderRadius: RADIUS.lg,
    justifyContent: 'center', alignItems: 'center'
  },
  btnDisabled: { backgroundColor: '#E5E7EB' },
  btnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  qrIconWrap: {
    width: 68, height: 68, borderRadius: 20, backgroundColor: 'rgba(255,122,0,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm
  },
  scanBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', width: '100%', maxWidth: 220 },
  scanBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  scanBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  cardFull: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, paddingVertical: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1
  },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    paddingBottom: SPACING.sm, marginBottom: SPACING.xs
  },
  listTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000' },
  countBadge: { backgroundColor: 'rgba(255,122,0,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  countText: { fontSize: 11, color: COLORS.primary, ...FONTS.bold },

  emptyList: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center' },

  attendRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F9FAFB'
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  rowPhone: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md
  },
  timeText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, ...FONTS.semibold },
  historyBtn: {
    borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md
  },
  historyBtnText: { fontSize: 11, color: '#444', ...FONTS.medium },

  // Scanner UI
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  scanTitle: { color: '#fff', fontSize: FONTS.sizes.lg, ...FONTS.bold, marginBottom: 40 },
  scanTarget: { width: 220, height: 220, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: COLORS.primary },
  scanSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.sm, marginTop: 40, ...FONTS.medium },
  closeBtn: {
    position: 'absolute', top: 50, right: 20, width: 44, height: 44,
    borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
  },
  torchBtn: {
    position: 'absolute', bottom: 50, right: 20, width: 44, height: 44,
    borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
  },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 40, maxHeight: 450, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  modalTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', flex: 1, marginRight: 10 },
  emptyModal: { padding: 40, textAlign: 'center', color: '#666', fontSize: FONTS.sizes.sm },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  historyDate: { fontSize: FONTS.sizes.sm, color: '#222', ...FONTS.medium },
  historyTimeTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.md },
  historyTimeText: { fontSize: FONTS.sizes.xs, color: '#000', ...FONTS.bold },
});
