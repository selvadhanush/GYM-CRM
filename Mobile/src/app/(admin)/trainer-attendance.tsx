import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';

const { width } = Dimensions.get('window');

export default function TrainerAttendanceScreen() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isTrainer = user?.role === 'trainer';

  const [logs, setLogs] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeLog, setActiveLog] = useState<any | null>(null);

  // Selector search state
  const [trainerSearch, setTrainerSearch] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchTrainers = async () => {
    try {
      const data = await adminService.getStaff();
      // Filter only trainers
      setTrainers(data.filter((s: any) => s.role === 'trainer') || []);
    } catch (err) {
      console.error('Error fetching trainers:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const targetTrainer = selectedTrainerId || (isTrainer ? (user?._id || (user as any)?.id) : '');
      const data = await adminService.getTrainerAttendance(targetTrainer);
      setLogs(data || []);

      // Check check-in status
      if (targetTrainer) {
        const active = data.find((l: any) => l.trainerId === targetTrainer && !l.checkOutTime);
        if (active) {
          setIsCheckedIn(true);
          setActiveLog(active);
        } else {
          setIsCheckedIn(false);
          setActiveLog(null);
        }
      } else {
        setIsCheckedIn(false);
        setActiveLog(null);
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTrainers();
    } else if (isTrainer) {
      setSelectedTrainerId(user?._id || (user as any)?.id || '');
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [selectedTrainerId]);

  const handleCheckIn = async () => {
    try {
      const target = isAdmin ? selectedTrainerId : '';
      await adminService.trainerCheckIn(target);
      Alert.alert('Success', 'Trainer checked in successfully!');
      fetchLogs();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = () => {
    Alert.alert(
      'Punch Out Shift',
      'Are you sure you want to Check Out of your active shift now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Punch Out',
          onPress: async () => {
            try {
              const target = isAdmin ? selectedTrainerId : '';
              await adminService.trainerCheckOut(target);
              Alert.alert('Success', 'Trainer checked out successfully!');
              fetchLogs();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Check-out failed');
            }
          }
        }
      ]
    );
  };

  // Monthly stats calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyLogs = logs.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalHours = monthlyLogs
    .reduce((sum, l) => sum + (l.workingHours || 0), 0)
    .toFixed(1);

  const activeDays = monthlyLogs.length;

  const filteredTrainers = trainers.filter(t =>
    t.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(trainerSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Shift Clock</Text>
            <Text style={styles.subtitle}>Trainer attendance sheets</Text>
          </View>
        </View>

        {/* Admin Select Trainer dropdown */}
        {isAdmin && (
          <View style={styles.dropdownCard}>
            <Text style={styles.dropdownLabel}>Manage Trainer Profile</Text>
            <View style={styles.searchWrapper}>
              <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={selectedTrainer ? `${selectedTrainer.name} (${selectedTrainer.email})` : "All Trainers Logs"}
                value={trainerSearch}
                onFocus={() => setIsDropdownOpen(true)}
                onChangeText={(txt) => {
                  setTrainerSearch(txt);
                  setIsDropdownOpen(true);
                }}
              />
              {selectedTrainer && (
                <TouchableOpacity onPress={() => { setTrainerSearch(''); setSelectedTrainer(null); setSelectedTrainerId(''); }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {isDropdownOpen && trainerSearch !== '' && (
              <View style={styles.dropdown}>
                {filteredTrainers.length === 0 ? (
                  <Text style={styles.emptySearch}>No trainers found</Text>
                ) : (
                  filteredTrainers.slice(0, 4).map((t) => (
                    <TouchableOpacity 
                      key={t._id} 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedTrainer(t);
                        setSelectedTrainerId(t._id);
                        setTrainerSearch(`${t.name} (${t.email})`);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropName}>{t.name}</Text>
                      <Text style={styles.dropEmail}>{t.email}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <View>
            {/* Action and Stats Cards */}
            <View style={styles.gridContainer}>
              {/* Punch Card UI */}
              {(isTrainer || (isAdmin && selectedTrainerId)) && (
                <View style={[styles.card, styles.punchCard, { borderLeftColor: isCheckedIn ? COLORS.success : '#EF4444' }]}>
                  <Ionicons 
                    name="time-outline" 
                    size={36} 
                    color={isCheckedIn ? COLORS.success : COLORS.textMuted} 
                  />
                  <Text style={styles.punchTitle}>
                    {isCheckedIn ? 'Active Shift Active' : 'Shift Logged Out'}
                  </Text>
                  <Text style={styles.punchSubtitle}>
                    {isCheckedIn 
                      ? `Clocked in: ${new Date(activeLog?.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` 
                      : 'Punch in to start shift tracking'
                    }
                  </Text>

                  {isCheckedIn ? (
                    <TouchableOpacity style={[styles.btn, styles.checkoutBtn]} onPress={handleCheckOut}>
                      <Ionicons name="stop" size={14} color="#fff" />
                      <Text style={styles.btnText}>Punch Out</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.btn, styles.checkinBtn]} onPress={handleCheckIn}>
                      <Ionicons name="play" size={14} color="#fff" />
                      <Text style={styles.btnText}>Punch In</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Stats Boxes */}
              <View style={styles.statsRow}>
                <View style={[styles.card, styles.statBox]}>
                  <View style={[styles.iconWrap, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                    <Ionicons name="hourglass" size={18} color="#8B5CF6" />
                  </View>
                  <Text style={styles.statVal}>{totalHours} hrs</Text>
                  <Text style={styles.statLbl}>Hours Logged</Text>
                </View>

                <View style={[styles.card, styles.statBox]}>
                  <View style={[styles.iconWrap, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                    <Ionicons name="calendar" size={18} color={COLORS.success} />
                  </View>
                  <Text style={styles.statVal}>{activeDays} days</Text>
                  <Text style={styles.statLbl}>Days Present</Text>
                </View>
              </View>
            </View>

            {/* Shift History list */}
            <View style={styles.cardList}>
              <Text style={styles.sectionTitle}>Shift History</Text>
              {logs.length === 0 ? (
                <Text style={styles.emptyText}>No shifts logged in database.</Text>
              ) : (
                logs.map((log) => (
                  <View key={log._id} style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowDate}>
                        {new Date(log.date).toLocaleDateString('en-IN', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </Text>
                      {isAdmin && log.trainer && (
                        <Text style={styles.rowTrainerName}>Trainer: {log.trainer.name}</Text>
                      )}
                      <Text style={styles.rowTimes}>
                        {new Date(log.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'working'}
                      </Text>
                    </View>

                    <View style={styles.rowRight}>
                      <Text style={styles.rowHours}>
                        {log.workingHours !== null ? `${log.workingHours} hrs` : 'Active'}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: log.checkOutTime ? 'rgba(34,197,94,0.1)' : 'rgba(255,122,0,0.1)' }]}>
                        <Text style={[styles.badgeText, { color: log.checkOutTime ? COLORS.success : COLORS.primary }]}>
                          {log.checkOutTime ? 'Completed' : 'Working'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: SPACING.md, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, marginTop: 40 },
  title: { fontSize: 24, ...FONTS.bold, color: '#000' },
  subtitle: { fontSize: FONTS.sizes.sm, color: '#666', marginTop: 2, ...FONTS.regular },

  dropdownCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: SPACING.lg
  },
  dropdownLabel: { fontSize: FONTS.sizes.xs, ...FONTS.bold, color: '#444', marginBottom: 8 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: RADIUS.lg, paddingHorizontal: 10, height: 42 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: '100%', fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  dropdown: { backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 4, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  dropEmail: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 1 },
  emptySearch: { padding: 12, textAlign: 'center', color: '#666', fontSize: FONTS.sizes.xs },

  gridContainer: { marginBottom: SPACING.lg, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 },
  punchCard: { alignItems: 'center', borderLeftWidth: 5 },
  punchTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginTop: 8 },
  punchSubtitle: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2, marginBottom: 16 },

  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 10, borderRadius: RADIUS.lg },
  checkinBtn: { backgroundColor: COLORS.primary },
  checkoutBtn: { backgroundColor: '#EF4444' },
  btnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statVal: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },
  statLbl: { fontSize: 10, color: '#666', ...FONTS.medium, marginTop: 2 },

  cardList: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  sectionTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center', margin: 24 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLeft: { flex: 1 },
  rowDate: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  rowTrainerName: { fontSize: 11, color: '#444', marginTop: 2, ...FONTS.medium },
  rowTimes: { fontSize: 10, color: '#888', marginTop: 4, ...FONTS.semibold },

  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowHours: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: COLORS.primary },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.md, marginTop: 4 },
  badgeText: { fontSize: 9, ...FONTS.bold },
});
