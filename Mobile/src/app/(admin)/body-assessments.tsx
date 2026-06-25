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

const emptyForm = {
  weight: '', bmi: '', bodyFat: '', muscleMass: '', bmr: '',
  inBodyScore: '', assessmentDate: new Date().toISOString().split('T')[0]
};

export default function BodyAssessmentsScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  
  // Search state for member dropdown
  const [memberSearch, setMemberSearch] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const res = await adminService.getMembers(1, 100, '');
      setMembers(res.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchAssessments = async (memberId: string) => {
    try {
      setLoading(true);
      const data = await adminService.getBodyAssessments(memberId);
      // Sort assessments chronologically (date ascending)
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
      );
      setAssessments(sorted);
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      fetchAssessments(selectedMemberId);
    } else {
      setAssessments([]);
    }
  }, [selectedMemberId]);

  const handleOpenModal = (assessment: any = null) => {
    if (assessment) {
      setEditingAssessment(assessment);
      setFormData({
        weight: String(assessment.weight),
        bmi: String(assessment.bmi),
        bodyFat: String(assessment.bodyFat),
        muscleMass: String(assessment.muscleMass),
        bmr: String(assessment.bmr),
        inBodyScore: assessment.inBodyScore ? String(assessment.inBodyScore) : '',
        assessmentDate: assessment.assessmentDate.split('T')[0]
      });
    } else {
      setEditingAssessment(null);
      setFormData({
        ...emptyForm,
        assessmentDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedMemberId) {
      Alert.alert('Selection Error', 'Please select a member first.');
      return;
    }
    if (!formData.weight || !formData.bmi || !formData.bodyFat || !formData.muscleMass || !formData.bmr) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        memberId: selectedMemberId,
        weight: Number(formData.weight),
        bmi: Number(formData.bmi),
        bodyFat: Number(formData.bodyFat),
        muscleMass: Number(formData.muscleMass),
        bmr: Number(formData.bmr),
        inBodyScore: formData.inBodyScore ? Number(formData.inBodyScore) : null,
        assessmentDate: formData.assessmentDate
      };

      if (editingAssessment) {
        await adminService.updateBodyAssessment(editingAssessment._id, payload);
      } else {
        await adminService.createBodyAssessment(payload);
      }
      fetchAssessments(selectedMemberId);
      setIsModalOpen(false);
      Alert.alert('Success', 'InBody assessment logged.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this assessment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteBodyAssessment(id);
              fetchAssessments(selectedMemberId);
              Alert.alert('Deleted', 'Record removed.');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete record.');
            }
          }
        }
      ]
    );
  };

  // Helper to evaluate BMI status
  const getBmiStatus = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#38BDF8' };
    if (bmi < 25) return { label: 'Normal', color: COLORS.success };
    if (bmi < 30) return { label: 'Overweight', color: '#F59E0B' };
    return { label: 'Obese', color: '#EF4444' };
  };

  // Helper to evaluate Body Fat status
  const getFatStatus = (fat: number) => {
    if (fat < 10) return { label: 'Low', color: '#38BDF8' };
    if (fat < 20) return { label: 'Optimal', color: COLORS.success };
    if (fat < 25) return { label: 'Slightly Over', color: '#F59E0B' };
    return { label: 'High', color: '#EF4444' };
  };

  const latest = assessments[assessments.length - 1];
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : null;

  // Calculate direction arrows
  const getWeightChange = () => {
    if (!previous || !latest) return null;
    const diff = latest.weight - previous.weight;
    if (diff > 0) return { icon: 'arrow-up', color: '#EF4444', text: `+${diff.toFixed(1)} kg` };
    if (diff < 0) return { icon: 'arrow-down', color: COLORS.success, text: `${diff.toFixed(1)} kg` };
    return { icon: 'trending-up', color: '#888', text: 'no change' };
  };

  const getFatChange = () => {
    if (!previous || !latest) return null;
    const diff = latest.bodyFat - previous.bodyFat;
    if (diff > 0) return { icon: 'arrow-up', color: '#EF4444', text: `+${diff.toFixed(1)}%` };
    if (diff < 0) return { icon: 'arrow-down', color: COLORS.success, text: `${diff.toFixed(1)}%` };
    return { icon: 'trending-up', color: '#888', text: 'no change' };
  };

  const getMuscleChange = () => {
    if (!previous || !latest) return null;
    const diff = latest.muscleMass - previous.muscleMass;
    if (diff > 0) return { icon: 'arrow-up', color: COLORS.success, text: `+${diff.toFixed(1)} kg` };
    if (diff < 0) return { icon: 'arrow-down', color: '#EF4444', text: `${diff.toFixed(1)} kg` };
    return { icon: 'trending-up', color: '#888', text: 'no change' };
  };

  const filteredMembersForLookup = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone.includes(memberSearch)
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Fitness & InBody</Text>
            <Text style={styles.subtitle}>Track body composition histories</Text>
          </View>
          {selectedMemberId && (
            <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
              <Text style={styles.addBtnText}>+ Record</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Member Selector dropdown */}
        <View style={styles.dropdownCard}>
          <Text style={styles.dropdownLabel}>Select Gym Member</Text>
          {membersLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginTop: 6 }} />
          ) : (
            <View>
              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={selectedMember ? `${selectedMember.name} (${selectedMember.phone})` : "Find member..."}
                  value={memberSearch}
                  onFocus={() => setIsMemberDropdownOpen(true)}
                  onChangeText={(txt) => {
                    setMemberSearch(txt);
                    setIsMemberDropdownOpen(true);
                  }}
                />
                {selectedMember && (
                  <TouchableOpacity onPress={() => { setMemberSearch(''); setSelectedMember(null); setSelectedMemberId(''); }}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {isMemberDropdownOpen && memberSearch !== '' && (
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
                          setSelectedMemberId(m._id);
                          setMemberSearch(`${m.name} (${m.phone})`);
                          setIsMemberDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropName}>{m.name}</Text>
                        <Text style={styles.dropPhone}>{m.phone}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Main Content */}
        {!selectedMemberId ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No Member Selected</Text>
            <Text style={styles.emptySubtitle}>Search and select a member above to manage their fitness assessment logs.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : assessments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Assessments Logged</Text>
            <Text style={styles.emptySubtitle}>There are no historical body assessment records logged for this member.</Text>
            <TouchableOpacity style={[styles.addBtn, { marginTop: 12 }]} onPress={() => handleOpenModal()}>
              <Text style={styles.addBtnText}>Log First Assessment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Latest Metrics Overview Cards */}
            {latest && (
              <View style={styles.metricsContainer}>
                <Text style={styles.sectionTitle}>Latest Composition Metrics</Text>
                
                <View style={styles.gridRow}>
                  {/* Weight */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="barbell-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.metricLabel}>Weight</Text>
                    </View>
                    <Text style={styles.metricVal}>{latest.weight} kg</Text>
                    {getWeightChange() && (
                      <View style={styles.changeRow}>
                        <Ionicons name={getWeightChange()?.icon as any} size={12} color={getWeightChange()?.color} />
                        <Text style={[styles.changeText, { color: getWeightChange()?.color }]}>{getWeightChange()?.text}</Text>
                      </View>
                    )}
                  </View>

                  {/* Body Fat */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="flame-outline" size={16} color="#F59E0B" />
                      <Text style={styles.metricLabel}>Body Fat</Text>
                    </View>
                    <Text style={styles.metricVal}>{latest.bodyFat}%</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusPill, { backgroundColor: `${getFatStatus(latest.bodyFat).color}15` }]}>
                        <Text style={[styles.statusText, { color: getFatStatus(latest.bodyFat).color }]}>
                          {getFatStatus(latest.bodyFat).label}
                        </Text>
                      </View>
                      {getFatChange() && (
                        <Text style={[styles.changeTextMini, { color: getFatChange()?.color }]}>{getFatChange()?.text}</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.gridRow}>
                  {/* Muscle Mass */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="trending-up" size={16} color="#8B5CF6" />
                      <Text style={styles.metricLabel}>Muscle Mass</Text>
                    </View>
                    <Text style={styles.metricVal}>{latest.muscleMass} kg</Text>
                    {getMuscleChange() && (
                      <View style={styles.changeRow}>
                        <Ionicons name={getMuscleChange()?.icon as any} size={12} color={getMuscleChange()?.color} />
                        <Text style={[styles.changeText, { color: getMuscleChange()?.color }]}>{getMuscleChange()?.text}</Text>
                      </View>
                    )}
                  </View>

                  {/* BMI */}
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="pulse" size={16} color="#0EA5E9" />
                      <Text style={styles.metricLabel}>BMI</Text>
                    </View>
                    <Text style={styles.metricVal}>{latest.bmi}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${getBmiStatus(latest.bmi).color}15`, alignSelf: 'flex-start', marginTop: 4 }]}>
                      <Text style={[styles.statusText, { color: getBmiStatus(latest.bmi).color }]}>
                        {getBmiStatus(latest.bmi).label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Score & BMR Banner */}
                <View style={styles.bannerRow}>
                  <View style={styles.bannerCol}>
                    <Text style={styles.bannerLabel}>INBODY SCORE</Text>
                    <Text style={styles.bannerVal}>{latest.inBodyScore || 'N/A'} <Text style={{ fontSize: 14, color: '#888' }}>/ 100</Text></Text>
                  </View>
                  <View style={styles.bannerSep} />
                  <View style={styles.bannerCol}>
                    <Text style={styles.bannerLabel}>BMR (BASAL METABOLIC)</Text>
                    <Text style={styles.bannerVal}>{latest.bmr} <Text style={{ fontSize: 12, color: '#888' }}>kcal</Text></Text>
                  </View>
                </View>
              </View>
            )}

            {/* Assessment Records list */}
            <View style={styles.cardList}>
              <Text style={styles.sectionTitle}>Historical Records</Text>
              {[...assessments].reverse().map((item) => (
                <View key={item._id} style={styles.listRow}>
                  <View style={styles.listLeft}>
                    <Text style={styles.listDate}>
                      {new Date(item.assessmentDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </Text>
                    <View style={styles.listSubRow}>
                      <Text style={styles.listSubText}>W: {item.weight}kg</Text>
                      <Text style={styles.listSubText}>F: {item.bodyFat}%</Text>
                      <Text style={styles.listSubText}>M: {item.muscleMass}kg</Text>
                    </View>
                  </View>
                  <View style={styles.listRight}>
                    <View style={styles.listActionBtns}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenModal(item)}>
                        <Ionicons name="pencil-outline" size={14} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAssessment ? 'Edit Assessment' : 'Record InBody Assessment'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.doubleInputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Weight (kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 72.5"
                    value={formData.weight}
                    onChangeText={(txt) => setFormData({ ...formData, weight: txt })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>BMI *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 23.1"
                    value={formData.bmi}
                    onChangeText={(txt) => setFormData({ ...formData, bmi: txt })}
                  />
                </View>
              </View>

              <View style={styles.doubleInputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Body Fat (%) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 18.5"
                    value={formData.bodyFat}
                    onChangeText={(txt) => setFormData({ ...formData, bodyFat: txt })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Muscle Mass (kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 34.2"
                    value={formData.muscleMass}
                    onChangeText={(txt) => setFormData({ ...formData, muscleMass: txt })}
                  />
                </View>
              </View>

              <View style={styles.doubleInputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>BMR (kcal) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 1650"
                    value={formData.bmr}
                    onChangeText={(txt) => setFormData({ ...formData, bmr: txt })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>InBody Score (1-100)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 78"
                    value={formData.inBodyScore}
                    onChangeText={(txt) => setFormData({ ...formData, inBodyScore: txt })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Assessment Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2026-06-25"
                  value={formData.assessmentDate}
                  onChangeText={(txt) => setFormData({ ...formData, assessmentDate: txt })}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingAssessment ? 'Save Changes' : 'Record Assessment'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
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
  dropPhone: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 1 },
  emptySearch: { padding: 12, textAlign: 'center', color: '#666', fontSize: FONTS.sizes.xs },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: '#E5E7EB' },
  emptyTitle: { color: '#000', fontSize: FONTS.sizes.md, ...FONTS.bold, marginTop: 4 },
  emptySubtitle: { color: '#666', fontSize: FONTS.sizes.xs, textAlign: 'center', lineHeight: 18 },

  metricsContainer: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.sm },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metricLabel: { fontSize: 10, color: '#666', ...FONTS.medium },
  metricVal: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  changeText: { fontSize: 10, ...FONTS.semibold },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.md },
  statusText: { fontSize: 9, ...FONTS.bold },
  changeTextMini: { fontSize: 9, ...FONTS.semibold },

  bannerRow: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 16, alignItems: 'center', marginTop: 4
  },
  bannerCol: { flex: 1, alignItems: 'center' },
  bannerLabel: { fontSize: 9, color: '#666', ...FONTS.bold, marginBottom: 4 },
  bannerVal: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },
  bannerSep: { width: 1, height: 32, backgroundColor: '#E5E7EB' },

  cardList: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listLeft: { flex: 1 },
  listDate: { fontSize: FONTS.sizes.sm, ...FONTS.semibold, color: '#000' },
  listSubRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  listSubText: { fontSize: 10, color: '#888', ...FONTS.semibold },
  listRight: { flexDirection: 'row', alignItems: 'center' },
  listActionBtns: { flexDirection: 'row', gap: 6 },
  editBtn: { width: 28, height: 28, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  deleteBtn: { width: 28, height: 28, borderWidth: 1, borderColor: '#FEE2E2', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },

  doubleInputRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  submitBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.md },
  submitBtnText: { color: '#fff', fontSize: FONTS.sizes.md, ...FONTS.bold },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 80, padding: SPACING.lg },
  pickerTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  pickerOptionText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },
});
