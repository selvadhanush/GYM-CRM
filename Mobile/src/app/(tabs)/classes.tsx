import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { memberService } from '@/services/member';

const { width } = Dimensions.get('window');

const TYPE_COLORS: Record<string, string> = {
  Yoga: '#10b981', Zumba: '#f59e0b', Strength: '#6366f1', Cardio: '#ef4444',
  HIIT: '#f43f5e', Pilates: '#8b5cf6', CrossFit: '#0ea5e9', Boxing: '#d946ef',
  Dance: '#ec4899', Stretching: '#14b8a6'
};

export default function MemberClassesScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({});

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await memberService.getClasses();
      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleBook = async (gymClass: any) => {
    const classId = gymClass._id;
    setActionLoading(prev => ({ ...prev, [classId]: 'booking' }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await memberService.bookClass(classId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Booked!', `Successfully booked slot. ${res.seatsAvailable || 0} seats remaining.`);
      fetchClasses();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Failed to book', err?.message || 'Failed to book class');
    } finally {
      setActionLoading(prev => ({ ...prev, [classId]: null }));
    }
  };

  const handleCancel = async (gymClass: any) => {
    const classId = gymClass._id;
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel your slot for this class?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(prev => ({ ...prev, [classId]: 'cancelling' }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            try {
              await memberService.cancelClassBooking(classId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Cancelled', 'Your booking has been cancelled.');
              fetchClasses();
            } catch (err: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', err?.message || 'Failed to cancel booking');
            } finally {
              setActionLoading(prev => ({ ...prev, [classId]: null }));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Custom Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Group Classes</Text>
            <Text style={styles.subtitle}>Book workout slots with trainers</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No upcoming classes scheduled at your gym.</Text>
          </View>
        ) : (
          classes.map((gymClass) => {
            const classColor = TYPE_COLORS[gymClass.type] || COLORS.primary;
            const seatsAvailable = gymClass.seatsAvailable || 0;
            const maxSeats = gymClass.maxSeats || 10;
            const isFull = seatsAvailable <= 0;
            const isBooked = gymClass.isBooked;
            const action = actionLoading[gymClass._id];
            
            // Calculate occupied seats percentage
            const filledPercent = Math.min(100, Math.max(0, ((maxSeats - seatsAvailable) / maxSeats) * 100));

            return (
              <View 
                key={gymClass._id} 
                style={[
                  styles.classCard, 
                  { borderLeftColor: classColor },
                  isFull && !isBooked && { opacity: 0.8 }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: `${classColor}15` }]}>
                        <Text style={[styles.typeText, { color: classColor }]}>{gymClass.type}</Text>
                      </View>
                      {isBooked && (
                        <View style={styles.bookedBadge}>
                          <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                          <Text style={styles.bookedText}>Booked</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.className}>{gymClass.name}</Text>
                    {gymClass.trainerName && (
                      <Text style={styles.trainerName}>👤 Trainer: {gymClass.trainerName}</Text>
                    )}
                  </View>
                </View>

                {/* Details */}
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsText}>
                    📅 {new Date(gymClass.scheduleDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={styles.detailsText}>
                    ⏰ {gymClass.startTime} - {gymClass.endTime}
                  </Text>
                  {gymClass.description && (
                    <Text style={styles.classDesc}>📝 {gymClass.description}</Text>
                  )}
                </View>

                {/* Seats Progress Bar */}
                <View style={styles.seatsSection}>
                  <View style={styles.seatsHeader}>
                    <Text style={styles.seatsLabel}>Availability</Text>
                    <Text style={[styles.seatsVal, isFull ? { color: '#EF4444' } : { color: COLORS.success }]}>
                      {seatsAvailable} / {maxSeats} seats open
                    </Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${filledPercent}%`, backgroundColor: isFull ? '#EF4444' : classColor }
                      ]} 
                    />
                  </View>
                </View>

                {/* Action button */}
                {isBooked ? (
                  <TouchableOpacity 
                    style={[styles.btn, styles.cancelBtn]} 
                    disabled={!!action}
                    onPress={() => handleCancel(gymClass)}
                  >
                    <Text style={styles.cancelBtnText}>
                      {action === 'cancelling' ? 'Cancelling Booking...' : 'Cancel Reservation'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.btn, isFull ? styles.btnFull : { backgroundColor: classColor }]} 
                    disabled={isFull || !!action}
                    onPress={() => handleBook(gymClass)}
                  >
                    <Text style={styles.btnText}>
                      {action === 'booking' ? 'Reserving Seat...' : isFull ? 'Class Fully Booked' : 'Reserve Spot'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: SPACING.md, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.lg, marginTop: 40 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 24, ...FONTS.bold, color: '#000' },
  subtitle: { fontSize: FONTS.sizes.sm, color: '#666', marginTop: 2, ...FONTS.regular },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center', lineHeight: 22 },

  classCard: {
    backgroundColor: '#fff', borderLeftWidth: 4, borderRadius: RADIUS.xl,
    padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  typeText: { fontSize: 10, ...FONTS.bold, textTransform: 'uppercase' },
  bookedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.md },
  bookedText: { fontSize: 10, color: COLORS.success, ...FONTS.bold },

  className: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000' },
  trainerName: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2, ...FONTS.medium },

  detailsRow: { marginVertical: SPACING.sm, gap: 3 },
  detailsText: { fontSize: FONTS.sizes.xs, color: '#444', ...FONTS.medium },
  classDesc: { fontSize: FONTS.sizes.xs, color: '#888', ...FONTS.regular, marginTop: 4 },

  seatsSection: { marginVertical: SPACING.xs, marginBottom: SPACING.md },
  seatsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  seatsLabel: { fontSize: 10, color: '#888', ...FONTS.medium },
  seatsVal: { fontSize: 10, ...FONTS.bold },
  progressContainer: { height: 6, backgroundColor: '#F3F4F6', borderRadius: RADIUS.full, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: RADIUS.full },

  btn: { height: 44, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },
  btnFull: { backgroundColor: '#E5E7EB' },
  cancelBtn: { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  cancelBtnText: { color: '#EF4444', fontSize: FONTS.sizes.sm, ...FONTS.bold },
});
