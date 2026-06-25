import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';

const { width } = Dimensions.get('window');

const STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
const SOURCES = ['Walk-in', 'Instagram', 'Facebook', 'Referral', 'Google', 'WhatsApp', 'Other'];

const STATUS_COLORS: Record<string, string> = {
  New: COLORS.primary,
  Contacted: '#f59e0b',
  Interested: '#0ea5e9',
  Converted: COLORS.success,
  Lost: '#6b7280'
};

const PIPELINE_EMOJIS: Record<string, string> = { 
  New: '🆕', Contacted: '📞', Interested: '⭐', Converted: '✅', Lost: '❌' 
};

const emptyForm = {
  name: '', phone: '', email: '', source: 'Walk-in',
  interestedPlan: '', notes: '',
  followUpDate: new Date().toISOString().split('T')[0],
  assignedTo: ''
};

export default function LeadsScreen() {
  const [leads, setLeads] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState<{ lead: any } | null>(null);
  const [editLead, setEditLead] = useState<any | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [leadsRes, summaryRes] = await Promise.all([
        adminService.getLeads(),
        adminService.getLeadsSummary()
      ]);
      setLeads(leadsRes || []);
      setSummary(summaryRes || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditLead(null);
    setFormData({
      ...emptyForm,
      followUpDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEdit = (lead: any) => {
    setEditLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      source: lead.source || 'Walk-in',
      interestedPlan: lead.interestedPlan || '',
      notes: lead.notes || '',
      followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 10) : new Date().toISOString().split('T')[0],
      assignedTo: lead.assignedTo || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Validation Error', 'Name and Phone fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editLead) {
        await adminService.updateLead(editLead._id, formData);
      } else {
        await adminService.createLead(formData);
      }
      setIsModalOpen(false);
      fetchAll();
      Alert.alert('Success', editLead ? 'Lead updated successfully' : 'Lead created successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (lead: any, newStatus: string) => {
    try {
      await adminService.updateLead(lead._id, { status: newStatus });
      setIsStatusPickerOpen(null);
      fetchAll();
      Alert.alert('Success', `Status updated to ${newStatus}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = (lead: any) => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete ${lead.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteLead(lead._id);
              fetchAll();
              Alert.alert('Deleted', 'Lead has been removed.');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete lead.');
            }
          }
        }
      ]
    );
  };

  const filteredLeads = leads.filter(l => {
    const matchStatus = !filterStatus || l.status === filterStatus;
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    return matchStatus && matchSearch;
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Lead Pipeline</Text>
            <Text style={styles.subtitle}>
              {leads.length} total leads · {summary?.followUpDue || 0} due today
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Add Lead</Text>
          </TouchableOpacity>
        </View>

        {/* Pipeline Summary Horizontal Cards */}
        {summary && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryContainer}>
            {STATUSES.map(s => {
              const count = summary.statusCounts?.find((x: any) => x._id === s)?.count || 0;
              const col = STATUS_COLORS[s];
              const isActive = filterStatus === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.summaryCard, { borderBottomColor: col }, isActive && { borderWidth: 2, borderColor: col }]}
                  onPress={() => setFilterStatus(isActive ? '' : s)}
                >
                  <Text style={styles.summaryEmoji}>{PIPELINE_EMOJIS[s]}</Text>
                  <Text style={[styles.summaryCount, { color: col }]}>{count}</Text>
                  <Text style={styles.summaryLabel}>{s}</Text>
                </TouchableOpacity>
              );
            })}
            <View style={[styles.summaryCard, { borderBottomColor: COLORS.success }]}>
              <Text style={styles.summaryEmoji}>📈</Text>
              <Text style={[styles.summaryCount, { color: COLORS.success }]}>{summary.conversionRate}%</Text>
              <Text style={styles.summaryLabel}>Conversion</Text>
            </View>
          </ScrollView>
        )}

        {/* Source breakdown tags */}
        {summary?.sourceCounts?.length > 0 && (
          <View style={styles.sourceRow}>
            {summary.sourceCounts.map((s: any) => (
              <View key={s._id} style={styles.sourceTag}>
                <Text style={styles.sourceTagText}>{s._id}: {s.count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads by name or phone..."
            value={search}
            onChangeText={(txt) => setSearch(txt)}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
          {filterStatus !== '' && (
            <TouchableOpacity style={styles.clearFilter} onPress={() => setFilterStatus('')}>
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Leads List */}
        <View style={styles.cardList}>
          <Text style={styles.sectionTitle}>Leads Pipeline</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 24 }} />
          ) : filteredLeads.length === 0 ? (
            <Text style={styles.emptyText}>No leads in this pipeline stage.</Text>
          ) : (
            filteredLeads.map((lead) => {
              const statusColor = STATUS_COLORS[lead.status] || '#6b7280';
              const followUp = lead.followUpDate ? lead.followUpDate.slice(0, 10) : null;
              const isOverdue = followUp && followUp < todayStr && !['Converted', 'Lost'].includes(lead.status);

              return (
                <View key={lead._id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowMemberName}>{lead.name}</Text>
                    <Text style={styles.rowPhone}>{lead.phone}</Text>
                    
                    <View style={styles.detailsRow}>
                      <View style={styles.sourceBadge}>
                        <Text style={styles.sourceText}>{lead.source}</Text>
                      </View>
                      {lead.interestedPlan ? (
                        <Text style={styles.planText}>Plan: {lead.interestedPlan}</Text>
                      ) : null}
                    </View>

                    {followUp && (
                      <View style={styles.followUpRow}>
                        <Ionicons 
                          name={isOverdue ? 'alert-circle' : 'calendar-outline'} 
                          size={12} 
                          color={isOverdue ? '#EF4444' : '#666'} 
                        />
                        <Text style={[styles.followUpText, isOverdue && { color: '#EF4444', fontWeight: 'bold' }]}>
                          Follow-up: {new Date(followUp).toLocaleDateString('en-IN')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.rowRight}>
                    <TouchableOpacity 
                      style={[styles.statusDropdown, { backgroundColor: `${statusColor}15` }]}
                      onPress={() => setIsStatusPickerOpen({ lead })}
                    >
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {PIPELINE_EMOJIS[lead.status]} {lead.status}
                      </Text>
                      <Ionicons name="chevron-down" size={10} color={statusColor} />
                    </TouchableOpacity>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(lead)}>
                        <Ionicons name="pencil-outline" size={14} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(lead)}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add / Edit Lead Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editLead ? '✏️ Edit Sales Lead' : '🎯 Add Sales Lead'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Full name..."
                  value={formData.name}
                  onChangeText={(txt) => setFormData({ ...formData, name: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile number..."
                  value={formData.phone}
                  onChangeText={(txt) => setFormData({ ...formData, phone: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="email-address"
                  placeholder="Optional email..."
                  value={formData.email}
                  onChangeText={(txt) => setFormData({ ...formData, email: txt })}
                />
              </View>

              <View style={styles.doubleGroup}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Source *</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setIsSourcePickerOpen(true)}>
                    <Text style={styles.selectorText}>{formData.source}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Interested Plan</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Annual"
                    value={formData.interestedPlan}
                    onChangeText={(txt) => setFormData({ ...formData, interestedPlan: txt })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Follow-up Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2026-06-25"
                  value={formData.followUpDate}
                  onChangeText={(txt) => setFormData({ ...formData, followUpDate: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  placeholder="Notes about client requirements..."
                  value={formData.notes}
                  onChangeText={(txt) => setFormData({ ...formData, notes: txt })}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editLead ? 'Save Changes' : 'Create Lead'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Source Picker Modal */}
      <Modal visible={isSourcePickerOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsSourcePickerOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Source</Text>
            {SOURCES.map((s) => (
              <TouchableOpacity 
                key={s} 
                style={styles.pickerOption} 
                onPress={() => { setFormData({ ...formData, source: s }); setIsSourcePickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, formData.source === s && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Picker Modal */}
      {isStatusPickerOpen && (
        <Modal visible={!!isStatusPickerOpen} transparent animationType="fade">
          <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsStatusPickerOpen(null)}>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Change Pipeline Stage</Text>
              {STATUSES.map((s) => (
                <TouchableOpacity 
                  key={s} 
                  style={styles.pickerOption} 
                  onPress={() => handleUpdateStatus(isStatusPickerOpen.lead, s)}
                >
                  <Text style={[styles.pickerOptionText, isStatusPickerOpen.lead.status === s && { color: COLORS.primary, fontWeight: 'bold' }]}>
                    {PIPELINE_EMOJIS[s]} {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
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

  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg },
  addBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  summaryContainer: { marginBottom: SPACING.md, flexDirection: 'row' },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 12, marginRight: 10,
    width: 100, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
    borderBottomWidth: 4
  },
  summaryEmoji: { fontSize: 18, marginBottom: 4 },
  summaryCount: { fontSize: FONTS.sizes.md, ...FONTS.bold },
  summaryLabel: { fontSize: 9, color: '#666', marginTop: 2, ...FONTS.semibold },

  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  sourceTag: { backgroundColor: 'rgba(255,122,0,0.06)', borderWidth: 1, borderColor: 'rgba(255,122,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  sourceTagText: { fontSize: 10, color: COLORS.primary, ...FONTS.bold },

  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: RADIUS.xl, paddingHorizontal: 12, height: 46, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },
  clearFilter: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md, marginLeft: 6 },
  clearFilterText: { fontSize: 10, color: '#666', ...FONTS.bold },

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
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sourceBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.md },
  sourceText: { fontSize: 9, color: '#444', ...FONTS.semibold },
  planText: { fontSize: 10, color: '#888', ...FONTS.medium },
  followUpRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  followUpText: { fontSize: 10, color: '#666', ...FONTS.regular },

  rowRight: { alignItems: 'flex-end', gap: 6 },
  statusDropdown: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
  statusText: { fontSize: 10, ...FONTS.bold },

  actionButtons: { flexDirection: 'row', gap: 6, marginTop: 8 },
  editBtn: { width: 28, height: 28, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  deleteBtn: { width: 28, height: 28, borderWidth: 1, borderColor: '#FEE2E2', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' },

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
