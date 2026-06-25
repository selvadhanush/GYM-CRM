import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, FlatList, Modal, Alert, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';
import type { Member } from '@/types';

const { width, height } = Dimensions.get('window');

const CLASS_TYPES = ['Yoga', 'Zumba', 'Strength', 'Cardio', 'HIIT', 'Pilates', 'CrossFit', 'Boxing', 'Dance', 'Stretching'];

const TYPE_COLORS: Record<string, string> = {
  Yoga: '#10b981', Zumba: '#f59e0b', Strength: '#6366f1', Cardio: '#ef4444',
  HIIT: '#f43f5e', Pilates: '#8b5cf6', CrossFit: '#0ea5e9', Boxing: '#d946ef',
  Dance: '#ec4899', Stretching: '#14b8a6'
};

export default function ClassesScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingsModal, setBookingsModal] = useState<any | null>(null);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);

  // Search/Select member for bookings
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '', type: 'Yoga', description: '', trainerName: '',
    scheduleDate: new Date().toISOString().split('T')[0],
    startTime: '', endTime: '', maxSeats: '10'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await adminService.getClasses();
      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await adminService.getMembers(1, 1000, '');
      setMembers((data.members || []).filter((m: any) => m.status === 'Active'));
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.startTime || !formData.endTime || !formData.maxSeats) {
      Alert.alert('Validation Error', 'Please fill in Name, Times, and Capacity.');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.createClass({
        ...formData,
        maxSeats: Number(formData.maxSeats)
      });
      setIsModalOpen(false);
      setFormData({
        name: '', type: 'Yoga', description: '', trainerName: '',
        scheduleDate: new Date().toISOString().split('T')[0],
        startTime: '', endTime: '', maxSeats: '10'
      });
      fetchClasses();
      Alert.alert('Success', 'Class scheduled successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this scheduled class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteClass(id);
              fetchClasses();
              Alert.alert('Success', 'Class deleted successfully.');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete class.');
            }
          }
        }
      ]
    );
  };

  const viewBookings = async (gymClass: any) => {
    try {
      // In the backend schema, we can fetch detailed bookings for the class
      // Let's assume we can fetch class details or call getClasses again
      // We will read class.bookings
      setBookingsModal(gymClass);
      fetchMembers();
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch bookings');
    }
  };

  const handleAdminBook = async () => {
    if (!selectedMember) {
      Alert.alert('Selection Error', 'Please select a member first.');
      return;
    }
    try {
      // Create class booking endpoint (we'll fetch details after update)
      const res = await adminService.updateClass(bookingsModal._id, {
        bookings: [
          ...(bookingsModal.bookings || []).map((b: any) => b.memberId?._id || b.memberId || b),
          selectedMember._id
        ]
      });
      setBookingsModal(res);
      setSelectedMember(null);
      setSearchQuery('');
      fetchClasses();
      Alert.alert('Success', 'Member booked successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to book member');
    }
  };

  const handleAdminCancel = (memberId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Remove this member from the class registration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBookings = (bookingsModal.bookings || [])
                .filter((b: any) => {
                  const id = b.memberId?._id || b.memberId || b;
                  return id.toString() !== memberId.toString();
                })
                .map((b: any) => b.memberId?._id || b.memberId || b);

              const res = await adminService.updateClass(bookingsModal._id, {
                bookings: updatedBookings
              });
              setBookingsModal(res);
              fetchClasses();
              Alert.alert('Success', 'Booking cancelled.');
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          }
        }
      ]
    );
  };

  const filteredMembersForClass = members.filter(m => {
    // Exclude members already booked
    const isBooked = bookingsModal?.bookings?.some((b: any) => {
      const id = b.memberId?._id || b.memberId || b;
      return id.toString() === m._id.toString();
    });
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery);
    return !isBooked && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Fitness Classes</Text>
            <Text style={styles.subtitle}>Schedule workouts and manage bookings</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
            <Text style={styles.addBtnText}>+ Schedule</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No classes scheduled. Tap '+ Schedule' to create one!</Text>
          </View>
        ) : (
          classes.map((gymClass) => {
            const classColor = TYPE_COLORS[gymClass.type] || COLORS.primary;
            const seatsFilled = gymClass.bookings?.length || 0;
            const totalSeats = gymClass.maxSeats || 10;
            const isFull = seatsFilled >= totalSeats;

            return (
              <View key={gymClass._id} style={[styles.classCard, { borderLeftColor: classColor }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: `${classColor}15` }]}>
                        <Text style={[styles.typeText, { color: classColor }]}>{gymClass.type}</Text>
                      </View>
                      <View style={[styles.seatsBadge, isFull ? styles.seatsFull : styles.seatsOpen]}>
                        <Text style={[styles.seatsText, isFull ? styles.seatsTextFull : styles.seatsTextOpen]}>
                          {seatsFilled}/{totalSeats} Booked
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.className}>{gymClass.name}</Text>
                    {gymClass.trainerName && (
                      <Text style={styles.classTrainer}>Trainer: {gymClass.trainerName}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.timeInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.infoText}>
                      {new Date(gymClass.scheduleDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.infoText}>{gymClass.startTime} - {gymClass.endTime}</Text>
                  </View>
                  {gymClass.description && (
                    <Text style={styles.classDesc} numberOfLines={2}>{gymClass.description}</Text>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.bookingsBtn} onPress={() => viewBookings(gymClass)}>
                    <Ionicons name="people-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.bookingsBtnText}>Bookings ({seatsFilled})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(gymClass._id)}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Schedule Class Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule New Class</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Class Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Yoga Flow"
                  value={formData.name}
                  onChangeText={(txt) => setFormData({ ...formData, name: txt })}
                />
              </View>

              <View style={styles.doubleGroup}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Type *</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setIsTypePickerOpen(true)}>
                    <Text style={styles.selectorText}>{formData.type}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Max Seats *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={formData.maxSeats}
                    onChangeText={(txt) => setFormData({ ...formData, maxSeats: txt })}
                  />
                </View>
              </View>

              <View style={styles.doubleGroup}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Trainer Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Trainer"
                    value={formData.trainerName}
                    onChangeText={(txt) => setFormData({ ...formData, trainerName: txt })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.scheduleDate}
                    onChangeText={(txt) => setFormData({ ...formData, scheduleDate: txt })}
                  />
                </View>
              </View>

              <View style={styles.doubleGroup}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Start Time (e.g. 07:00 AM) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="07:00 AM"
                    value={formData.startTime}
                    onChangeText={(txt) => setFormData({ ...formData, startTime: txt })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>End Time (e.g. 08:00 AM) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="08:00 AM"
                    value={formData.endTime}
                    onChangeText={(txt) => setFormData({ ...formData, endTime: txt })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  placeholder="Optional description..."
                  value={formData.description}
                  onChangeText={(txt) => setFormData({ ...formData, description: txt })}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Schedule Class</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Class Bookings Management Modal */}
      {bookingsModal && (
        <Modal visible={!!bookingsModal} animationType="slide" transparent={true}>
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { height: height - 120 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Bookings: {bookingsModal.name}
                </Text>
                <TouchableOpacity onPress={() => { setBookingsModal(null); setSelectedMember(null); setSearchQuery(''); }}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Booking search + add form */}
              <View style={styles.quickAddBooking}>
                <Text style={styles.inputLabel}>Book Active Member</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={[styles.searchWrapper, { flex: 1, marginBottom: 0 }]}>
                    <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Find member..."
                      value={searchQuery}
                      onFocus={() => setIsMemberDropdownOpen(true)}
                      onChangeText={(txt) => {
                        setSearchQuery(txt);
                        setIsMemberDropdownOpen(true);
                      }}
                    />
                    {searchQuery !== '' && (
                      <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedMember(null); }}>
                        <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity style={styles.bookActionBtn} onPress={handleAdminBook}>
                    <Text style={styles.bookActionText}>Book</Text>
                  </TouchableOpacity>
                </View>

                {/* dropdown */}
                {isMemberDropdownOpen && searchQuery !== '' && (
                  <View style={styles.dropdown}>
                    {filteredMembersForClass.length === 0 ? (
                      <Text style={styles.emptySearch}>No members eligible</Text>
                    ) : (
                      filteredMembersForClass.slice(0, 4).map((m) => (
                        <TouchableOpacity 
                          key={m._id} 
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedMember(m);
                            setSearchQuery(`${m.name} (${m.phone})`);
                            setIsMemberDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropName}>{m.name}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>

              {/* Bookings List */}
              <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>Attendee List</Text>
              {(!bookingsModal.bookings || bookingsModal.bookings.length === 0) ? (
                <Text style={styles.emptyText}>No attendees registered yet.</Text>
              ) : (
                <FlatList
                  data={bookingsModal.bookings}
                  keyExtractor={(item, idx) => (item._id || item.memberId?._id || idx).toString()}
                  renderItem={({ item }) => {
                    const memberName = item.memberName || item.memberId?.name || 'Unknown Member';
                    const memberId = item.memberId?._id || item.memberId;
                    return (
                      <View style={styles.attendeeRow}>
                        <View>
                          <Text style={styles.attendeeName}>{memberName}</Text>
                          {item.bookedAt && (
                            <Text style={styles.attendeeTime}>
                              Booked: {new Date(item.bookedAt).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity 
                          style={styles.cancelBookingBtn}
                          onPress={() => handleAdminCancel(memberId)}
                        >
                          <Text style={styles.cancelBookingText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Type Picker Dropdown Modal */}
      <Modal visible={isTypePickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsTypePickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Class Type</Text>
            {CLASS_TYPES.map((t) => (
              <TouchableOpacity 
                key={t} 
                style={styles.pickerOption} 
                onPress={() => { setFormData({ ...formData, type: t }); setIsTypePickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, formData.type === t && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {t}
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

  emptyContainer: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, textAlign: 'center' },

  classCard: {
    backgroundColor: '#fff', borderLeftWidth: 4, borderRadius: RADIUS.xl,
    padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  typeText: { fontSize: 10, ...FONTS.bold },
  seatsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.md },
  seatsOpen: { backgroundColor: 'rgba(34,197,94,0.08)' },
  seatsFull: { backgroundColor: 'rgba(239,68,68,0.08)' },
  seatsText: { fontSize: 10, ...FONTS.bold },
  seatsTextOpen: { color: COLORS.success },
  seatsTextFull: { color: '#EF4444' },

  className: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000' },
  classTrainer: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2, ...FONTS.medium },

  timeInfo: { marginVertical: SPACING.sm, gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: FONTS.sizes.xs, color: '#444', ...FONTS.medium },
  classDesc: { fontSize: FONTS.sizes.xs, color: '#888', ...FONTS.regular, marginTop: 4 },

  actionRow: { flexDirection: 'row', gap: SPACING.sm, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4 },
  bookingsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)', backgroundColor: 'rgba(255,122,0,0.05)', paddingVertical: 8, borderRadius: RADIUS.md },
  bookingsBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, ...FONTS.bold },
  deleteBtn: { borderWidth: 1, borderColor: '#FEE2E2', paddingHorizontal: 12, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },

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

  // Bookings management
  quickAddBooking: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#E5E7EB' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 10, height: 40, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: '100%', fontSize: FONTS.sizes.xs, color: '#000', ...FONTS.regular },
  bookActionBtn: { backgroundColor: COLORS.primary, height: 40, paddingHorizontal: 16, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  bookActionText: { color: '#fff', fontSize: FONTS.sizes.xs, ...FONTS.bold },

  dropdown: { backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 4, overflow: 'hidden' },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropName: { fontSize: FONTS.sizes.xs, color: '#000', ...FONTS.medium },
  emptySearch: { padding: 12, textAlign: 'center', color: '#666', fontSize: FONTS.sizes.xs },

  sectionTitle: { fontSize: FONTS.sizes.sm, ...FONTS.bold, color: '#000', marginBottom: SPACING.sm },
  attendeeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  attendeeName: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  attendeeTime: { fontSize: 10, color: '#666', marginTop: 2 },
  cancelBookingBtn: { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.md },
  cancelBookingText: { fontSize: 10, color: '#EF4444', ...FONTS.bold },
});
