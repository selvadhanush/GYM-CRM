import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, FlatList, Modal, Alert, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';
import type { Member } from '@/types';

const { width } = Dimensions.get('window');

const FREEZE_REASONS = ['Vacation', 'Injury', 'Travel', 'Personal Emergency', 'Other'];

export default function FreezeScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezeModal, setFreezeModal] = useState<Member | null>(null);
  const [historyModal, setHistoryModal] = useState<{ name: string; history: any[] } | null>(null);
  const [reason, setReason] = useState('');
  const [isReasonPickerOpen, setIsReasonPickerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({});
  const [search, setSearch] = useState('');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // Fetch members (since we want to search and freeze members, fetch top 100)
      const data = await adminService.getMembers(1, 100, '');
      setMembers(data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleFreeze = async () => {
    if (!freezeModal) return;
    const memberId = freezeModal._id;
    setActionLoading(prev => ({ ...prev, [memberId]: 'freezing' }));
    try {
      await adminService.freezeMember(memberId, { reason });
      setFreezeModal(null);
      setReason('');
      fetchMembers();
      Alert.alert('Success', `${freezeModal.name}'s membership is now frozen.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to freeze membership');
    } finally {
      setActionLoading(prev => ({ ...prev, [memberId]: null }));
    }
  };

  const handleUnfreeze = (member: Member) => {
    Alert.alert(
      'Unfreeze Membership',
      `Unfreeze ${member.name}? The expiry date will be extended by the number of days frozen.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfreeze',
          onPress: async () => {
            const memberId = member._id;
            setActionLoading(prev => ({ ...prev, [memberId]: 'unfreezing' }));
            try {
              const res = await adminService.unfreezeMember(memberId);
              const friendlyDate = new Date(res.newExpiryDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              });
              Alert.alert(
                'Membership Unfrozen!',
                `☀️ ${member.name} is now active.\n📅 Expiry extended by ${res.daysAdded} day(s).\n📆 New Expiry: ${friendlyDate}`
              );
              fetchMembers();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to unfreeze membership');
            } finally {
              setActionLoading(prev => ({ ...prev, [memberId]: null }));
            }
          }
        }
      ]
    );
  };

  const viewHistory = async (member: Member) => {
    try {
      const data = await adminService.getFreezeHistory(member._id);
      setHistoryModal({ name: member.name, history: data.freezeHistory || [] });
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch freeze history.');
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  const getStatusColor = (status: string) => {
    if (status === 'Frozen') return '#FF7A00';
    if (status === 'Active') return COLORS.success;
    return '#EF4444';
  };

  const frozenCount = members.filter(m => m.status === 'Frozen').length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Membership Freeze</Text>
            <Text style={styles.subtitle}>{frozenCount} member(s) currently frozen</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search member by name or phone..."
            value={search}
            onChangeText={(txt) => setSearch(txt)}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Members List */}
        <View style={styles.cardList}>
          <Text style={styles.sectionTitle}>Members</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
          ) : filteredMembers.length === 0 ? (
            <Text style={styles.emptyText}>No matching members found.</Text>
          ) : (
            filteredMembers.map((member) => {
              const statusColor = getStatusColor(member.status);
              const isFrozen = member.status === 'Frozen';
              const loadingState = actionLoading[member._id];

              return (
                <View key={member._id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowMemberName}>{member.name}</Text>
                    <Text style={styles.rowPhone}>{member.phone}</Text>
                    <Text style={styles.rowExpiry}>
                      Expiry: {new Date(member.expiryDate).toLocaleDateString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.rowRight}>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {isFrozen ? '❄️ Frozen' : member.status}
                      </Text>
                    </View>

                    <View style={styles.actionButtons}>
                      {isFrozen ? (
                        <TouchableOpacity
                          style={[styles.btn, styles.unfreezeBtn]}
                          disabled={!!loadingState}
                          onPress={() => handleUnfreeze(member)}
                        >
                          <Text style={styles.unfreezeBtnText}>Unfreeze</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.btn, styles.freezeBtn, member.status === 'Expired' && { opacity: 0.5 }]}
                          disabled={!!loadingState || member.status === 'Expired'}
                          onPress={() => { setFreezeModal(member); setReason(''); }}
                        >
                          <Text style={styles.freezeBtnText}>Freeze</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity 
                        style={styles.historyBtn} 
                        onPress={() => viewHistory(member)}
                      >
                        <Ionicons name="list-outline" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Freeze Confirm Modal */}
      <Modal visible={!!freezeModal} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Freeze: {freezeModal?.name}</Text>
              <TouchableOpacity onPress={() => setFreezeModal(null)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {freezeModal && (
              <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={styles.modalDescription}>
                  This member's access will be suspended immediately. When unfrozen, their membership duration will be extended by the total duration of this freeze.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason (optional)</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setIsReasonPickerOpen(true)}>
                    <Text style={styles.selectorText}>{reason || 'Select reason...'}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, styles.cancelModalBtn]} onPress={() => setFreezeModal(null)}>
                    <Text style={styles.cancelModalBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.submitModalBtn]} onPress={handleFreeze}>
                    <Text style={styles.submitModalBtnText}>Freeze Membership</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Freeze Reason Picker Modal */}
      <Modal visible={isReasonPickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsReasonPickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Reason</Text>
            {FREEZE_REASONS.map((r) => (
              <TouchableOpacity 
                key={r} 
                style={styles.pickerOption} 
                onPress={() => { setReason(r); setIsReasonPickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, reason === r && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* History Modal */}
      {historyModal && (
        <Modal visible={!!historyModal} animationType="fade" transparent={true}>
          <View style={styles.modalBgOverlay}>
            <View style={styles.historyModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>History: {historyModal.name}</Text>
                <TouchableOpacity onPress={() => setHistoryModal(null)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {historyModal.history.length === 0 ? (
                <Text style={styles.emptyText}>No freeze history found.</Text>
              ) : (
                <FlatList
                  data={historyModal.history}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.historyRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyReason}>{item.reason || 'No Reason Provided'}</Text>
                        <Text style={styles.historyDates}>
                          {new Date(item.freezeDate).toLocaleDateString()} - {item.unfreezeDate ? new Date(item.unfreezeDate).toLocaleDateString() : 'Active'}
                        </Text>
                      </View>
                      <View style={styles.daysBadge}>
                        <Text style={styles.daysBadgeText}>
                          {item.daysAdded !== undefined ? `+${item.daysAdded}d` : 'Frozen'}
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

  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: RADIUS.xl, paddingHorizontal: 12, height: 46, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  cardList: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  sectionTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center', margin: 24 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLeft: { flex: 1 },
  rowMemberName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  rowPhone: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2 },
  rowExpiry: { fontSize: 10, color: '#888', marginTop: 4, ...FONTS.semibold },

  rowRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: 10, ...FONTS.bold },

  actionButtons: { flexDirection: 'row', gap: 6, marginTop: 6 },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md, justifyContent: 'center' },
  freezeBtn: { backgroundColor: 'rgba(255,122,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)' },
  freezeBtnText: { color: COLORS.primary, fontSize: 11, ...FONTS.bold },
  unfreezeBtn: { backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  unfreezeBtnText: { color: COLORS.success, fontSize: 11, ...FONTS.bold },
  historyBtn: { width: 32, height: 32, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },
  modalDescription: { fontSize: FONTS.sizes.xs, color: '#666', lineHeight: 18, marginBottom: SPACING.md, ...FONTS.regular },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  selector: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' },
  selectorText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: SPACING.md },
  modalBtn: { flex: 1, height: 48, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  cancelModalBtn: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  cancelModalBtnText: { color: '#666', fontSize: FONTS.sizes.sm, ...FONTS.bold },
  submitModalBtn: { backgroundColor: COLORS.primary },
  submitModalBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 80, padding: SPACING.lg },
  pickerTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  pickerOptionText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },

  // History modal
  modalBgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  historyModalContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 40, maxHeight: 400, padding: SPACING.lg },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  historyReason: { fontSize: FONTS.sizes.sm, color: '#222', ...FONTS.bold },
  historyDates: { fontSize: 11, color: '#666', marginTop: 2, ...FONTS.medium },
  daysBadge: { backgroundColor: 'rgba(99,102,241,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
  daysBadgeText: { fontSize: 10, color: COLORS.primary, ...FONTS.bold },
});
