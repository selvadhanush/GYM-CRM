import { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, FlatList, Modal, Platform, Alert, Dimensions, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { adminService } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';

const { width, height } = Dimensions.get('window');

type TabType = 'list' | 'maintenance';

export default function EquipmentsScreen() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin';

  const [equipments, setEquipments] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);

  // Modals
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<any | null>(null);
  const [selectedEqForMaintenance, setSelectedEqForMaintenance] = useState<any | null>(null);

  // Form States
  const [eqForm, setEqForm] = useState({
    name: '',
    type: '',
    purchaseDate: '',
    warrantyExpiry: '',
    serviceSchedule: 'Monthly',
    status: 'Active'
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    serviceDate: new Date().toISOString().split('T')[0],
    cost: '0',
    description: '',
    technicianName: '',
    nextServiceDate: '',
    updateEquipmentStatus: 'Active'
  });

  useEffect(() => {
    fetchEquipmentsData();
    fetchMaintenanceLogsData();
  }, [statusFilter, typeFilter]);

  const fetchEquipmentsData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getEquipments({ status: statusFilter, type: typeFilter });
      setEquipments(data || []);
    } catch (error) {
      console.error('Error fetching equipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceLogsData = async () => {
    try {
      const data = await adminService.getMaintenanceLogs();
      setMaintenanceLogs(data || []);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEq(null);
    setEqForm({
      name: '',
      type: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: '',
      serviceSchedule: 'Monthly',
      status: 'Active'
    });
    setIsEqModalOpen(true);
  };

  const handleOpenEditModal = (eq: any) => {
    setEditingEq(eq);
    setEqForm({
      name: eq.name,
      type: eq.type || '',
      purchaseDate: eq.purchaseDate ? eq.purchaseDate.split('T')[0] : '',
      warrantyExpiry: eq.warrantyExpiry ? eq.warrantyExpiry.split('T')[0] : '',
      serviceSchedule: eq.serviceSchedule || 'Monthly',
      status: eq.status || 'Active'
    });
    setIsEqModalOpen(true);
  };

  const handleOpenMaintenanceModal = (eq: any) => {
    setSelectedEqForMaintenance(eq);
    setMaintenanceForm({
      serviceDate: new Date().toISOString().split('T')[0],
      cost: '0',
      description: '',
      technicianName: '',
      nextServiceDate: '',
      updateEquipmentStatus: 'Active'
    });
    setIsMaintenanceModalOpen(true);
  };

  const handleSaveEquipment = async () => {
    if (!eqForm.name.trim()) {
      Alert.alert('Validation Error', 'Equipment name is required.');
      return;
    }
    try {
      if (editingEq) {
        await adminService.updateEquipment(editingEq._id, eqForm);
        Alert.alert('Success', 'Equipment details updated successfully!');
      } else {
        await adminService.createEquipment(eqForm);
        Alert.alert('Success', 'New Equipment added successfully!');
      }
      setIsEqModalOpen(false);
      fetchEquipmentsData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save equipment details.');
    }
  };

  const handleDeleteEq = (id: string) => {
    Alert.alert(
      'Delete Equipment',
      'Are you sure you want to delete this equipment and all its maintenance records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteEquipment(id);
              Alert.alert('Success', 'Equipment deleted');
              fetchEquipmentsData();
              fetchMaintenanceLogsData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete equipment');
            }
          }
        }
      ]
    );
  };

  const handleSaveMaintenanceLog = async () => {
    if (!maintenanceForm.serviceDate || !maintenanceForm.cost) {
      Alert.alert('Validation Error', 'Service date and cost are required.');
      return;
    }
    try {
      await adminService.createMaintenanceLog({
        equipmentId: selectedEqForMaintenance._id,
        ...maintenanceForm,
        cost: Number(maintenanceForm.cost)
      });
      Alert.alert('Success', 'Maintenance log recorded successfully');
      setIsMaintenanceModalOpen(false);
      fetchEquipmentsData();
      fetchMaintenanceLogsData();
    } catch (error) {
      Alert.alert('Error', 'Failed to record maintenance log');
    }
  };

  const handleDeleteLog = (id: string) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this maintenance log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteMaintenanceLog(id);
              Alert.alert('Success', 'Maintenance log removed');
              fetchMaintenanceLogsData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete log');
            }
          }
        }
      ]
    );
  };

  // Calculate Summary Stats
  const totalEqCount = equipments.length;
  const activeCount = equipments.filter(e => e.status === 'Active').length;
  const maintenanceCount = equipments.filter(e => e.status === 'Under Maintenance').length;
  const brokenCount = equipments.filter(e => e.status === 'Broken' || e.status === 'Retired').length;

  return (
    <View style={styles.container}>
      {/* Scrollable Body */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Gym Equipments</Text>
            <Text style={styles.subtitle}>Monitor inventory and schedule repairs</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreateModal}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Dashboard */}
        {activeTab === 'list' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll} style={styles.statsScrollContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="construct" size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.statVal}>{totalEqCount}</Text>
              <Text style={styles.statLbl}>Total Assets</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.statVal}>{activeCount}</Text>
              <Text style={styles.statLbl}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="warning" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.statVal}>{maintenanceCount}</Text>
              <Text style={styles.statLbl}>In Repair</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </View>
              <Text style={styles.statVal}>{brokenCount}</Text>
              <Text style={styles.statLbl}>Broken</Text>
            </View>
          </ScrollView>
        )}

        {/* Tabs switcher */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'list' && styles.tabBtnTextActive]}>Equipments List</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'maintenance' && styles.tabBtnActive]}
            onPress={() => setActiveTab('maintenance')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'maintenance' && styles.tabBtnTextActive]}>Maintenance Logs</Text>
          </TouchableOpacity>
        </View>

        {/* Content Tabs */}
        {activeTab === 'list' ? (
          <View>
            {/* Filters Row */}
            <View style={styles.filtersRow}>
              <TouchableOpacity style={styles.filterSelector} onPress={() => setIsStatusFilterOpen(true)}>
                <Text style={styles.filterSelectorText}>{statusFilter || 'All Statuses'}</Text>
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterSelector} onPress={() => setIsTypeFilterOpen(true)}>
                <Text style={styles.filterSelectorText}>{typeFilter || 'All Categories'}</Text>
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>
              {(statusFilter || typeFilter) && (
                <TouchableOpacity style={styles.clearFilter} onPress={() => { setStatusFilter(''); setTypeFilter(''); }}>
                  <Ionicons name="close-circle" size={18} color="#FF7A00" />
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : equipments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No equipment found.</Text>
              </View>
            ) : (
              equipments.map((eq) => {
                const isWarrantyExpired = eq.warrantyExpiry && new Date(eq.warrantyExpiry) < new Date();
                return (
                  <View key={eq._id} style={styles.eqCard}>
                    <View style={styles.eqHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.eqName}>{eq.name}</Text>
                        <Text style={styles.eqCategory}>{eq.type || 'General'}</Text>
                      </View>
                      <View style={[
                        styles.badge,
                        eq.status === 'Active' ? styles.badgeActive : 
                        eq.status === 'Under Maintenance' ? styles.badgePending : styles.badgeExpired
                      ]}>
                        <Text style={[
                          styles.badgeText,
                          eq.status === 'Active' ? styles.badgeTextActive : 
                          eq.status === 'Under Maintenance' ? styles.badgeTextPending : styles.badgeTextExpired
                        ]}>
                          {eq.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.eqInfoRow}>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Purchased</Text>
                        <Text style={styles.infoValue}>
                          {eq.purchaseDate ? new Date(eq.purchaseDate).toLocaleDateString() : '—'}
                        </Text>
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Warranty</Text>
                        <Text style={[styles.infoValue, isWarrantyExpired && { color: '#ef4444', fontWeight: 'bold' }]}>
                          {eq.warrantyExpiry ? new Date(eq.warrantyExpiry).toLocaleDateString() : '—'}
                        </Text>
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Service Schedule</Text>
                        <Text style={styles.infoValue}>{eq.serviceSchedule || '—'}</Text>
                      </View>
                    </View>

                    {isAdmin && (
                      <View style={styles.actionsRow}>
                        <TouchableOpacity style={[styles.actionBtn, styles.repairBtn]} onPress={() => handleOpenMaintenanceModal(eq)}>
                          <Ionicons name="construct" size={14} color="#FFF" />
                          <Text style={styles.actionBtnText}>Log Repair</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => handleOpenEditModal(eq)}>
                          <Ionicons name="pencil" size={14} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtnSecondary, { borderColor: '#FEE2E2' }]} onPress={() => handleDeleteEq(eq._id)}>
                          <Ionicons name="trash" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <View>
            {maintenanceLogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No service logs recorded.</Text>
              </View>
            ) : (
              maintenanceLogs.map((log) => (
                <View key={log._id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logEqName}>{log.equipmentName}</Text>
                      <Text style={styles.logDate}>
                        Service: {new Date(log.serviceDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.logCost}>₹{log.cost ? log.cost.toLocaleString() : '0'}</Text>
                  </View>

                  <Text style={styles.logDesc}>{log.description || 'No work description log'}</Text>

                  <View style={styles.logFooter}>
                    <View style={styles.footerDetail}>
                      <Ionicons name="person-outline" size={12} color="#666" />
                      <Text style={styles.footerDetailText}>{log.technicianName || 'In-House'}</Text>
                    </View>
                    {log.nextServiceDate && (
                      <View style={[styles.footerDetail, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="calendar-outline" size={12} color={COLORS.success} />
                        <Text style={[styles.footerDetailText, { color: COLORS.success }]}>
                          Next: {new Date(log.nextServiceDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {isAdmin && (
                    <TouchableOpacity style={styles.deleteLogBtn} onPress={() => handleDeleteLog(log._id)}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      <Text style={styles.deleteLogBtnText}>Delete Log</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Equipment Add/Edit Modal */}
      <Modal visible={isEqModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEq ? 'Edit Equipment' : 'Add Equipment'}</Text>
              <TouchableOpacity onPress={() => setIsEqModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Equipment Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Treadmill T5"
                  value={eqForm.name}
                  onChangeText={(txt) => setEqForm({ ...eqForm, name: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category / Type</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Cardio, Strength, Free Weights, etc."
                  value={eqForm.type}
                  onChangeText={(txt) => setEqForm({ ...eqForm, type: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Purchase Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={eqForm.purchaseDate}
                  onChangeText={(txt) => setEqForm({ ...eqForm, purchaseDate: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Warranty Expiry (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={eqForm.warrantyExpiry}
                  onChangeText={(txt) => setEqForm({ ...eqForm, warrantyExpiry: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Service Schedule (e.g. Monthly, Quarterly)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Monthly, Bi-Monthly, etc."
                  value={eqForm.serviceSchedule}
                  onChangeText={(txt) => setEqForm({ ...eqForm, serviceSchedule: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Equipment Status</Text>
                <View style={styles.statusOptions}>
                  {['Active', 'Under Maintenance', 'Broken', 'Retired'].map((st) => (
                    <TouchableOpacity 
                      key={st}
                      style={[styles.statusOptionBtn, eqForm.status === st && styles.statusOptionBtnActive]}
                      onPress={() => setEqForm({ ...eqForm, status: st })}
                    >
                      <Text style={[styles.statusOptionText, eqForm.status === st && styles.statusOptionTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEquipment}>
                <Text style={styles.submitBtnText}>{editingEq ? 'Update Equipment' : 'Add Item'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Log Maintenance Modal */}
      <Modal visible={isMaintenanceModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>Log Repair: {selectedEqForMaintenance?.name}</Text>
              <TouchableOpacity onPress={() => setIsMaintenanceModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Service Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={maintenanceForm.serviceDate}
                  onChangeText={(txt) => setMaintenanceForm({ ...maintenanceForm, serviceDate: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Repair Cost (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={maintenanceForm.cost}
                  onChangeText={(txt) => setMaintenanceForm({ ...maintenanceForm, cost: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Technician / Company</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. John Doe (Service Inc.)"
                  value={maintenanceForm.technicianName}
                  onChangeText={(txt) => setMaintenanceForm({ ...maintenanceForm, technicianName: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Next Service Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={maintenanceForm.nextServiceDate}
                  onChangeText={(txt) => setMaintenanceForm({ ...maintenanceForm, nextServiceDate: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Work Details & Description</Text>
                <TextInput
                  style={[styles.textInput, { height: 80 }]}
                  multiline
                  numberOfLines={3}
                  placeholder="Work details..."
                  value={maintenanceForm.description}
                  onChangeText={(txt) => setMaintenanceForm({ ...maintenanceForm, description: txt })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Update Equipment Status To</Text>
                <View style={styles.statusOptions}>
                  {['Active', 'Under Maintenance', 'Broken'].map((st) => (
                    <TouchableOpacity 
                      key={st}
                      style={[styles.statusOptionBtn, maintenanceForm.updateEquipmentStatus === st && styles.statusOptionBtnActive]}
                      onPress={() => setMaintenanceForm({ ...maintenanceForm, updateEquipmentStatus: st })}
                    >
                      <Text style={[styles.statusOptionText, maintenanceForm.updateEquipmentStatus === st && styles.statusOptionTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveMaintenanceLog}>
                <Text style={styles.submitBtnText}>Submit Maintenance Log</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Status Filter Modal */}
      <Modal visible={isStatusFilterOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsStatusFilterOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Filter by Status</Text>
            {['', 'Active', 'Under Maintenance', 'Broken', 'Retired'].map((val) => (
              <TouchableOpacity 
                key={val} 
                style={styles.pickerOption} 
                onPress={() => { setStatusFilter(val); setIsStatusFilterOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, statusFilter === val && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {val === '' ? 'All Statuses' : val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Filter Modal */}
      <Modal visible={isTypeFilterOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setIsTypeFilterOpen(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Filter by Category</Text>
            {['', 'Cardio', 'Strength', 'Free Weights', 'Accessories', 'Other'].map((val) => (
              <TouchableOpacity 
                key={val} 
                style={styles.pickerOption} 
                onPress={() => { setTypeFilter(val); setIsTypeFilterOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, typeFilter === val && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {val === '' ? 'All Categories' : val}
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

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg },
  addBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  statsScrollContainer: { marginBottom: SPACING.lg, marginHorizontal: -SPACING.md },
  statsScroll: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  statCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 14, minWidth: 110,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center'
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  statVal: { fontSize: 18, ...FONTS.bold, color: '#000' },
  statLbl: { fontSize: FONTS.sizes.xs, color: '#666', ...FONTS.medium, marginTop: 2 },

  tabsContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', padding: 4, borderRadius: RADIUS.lg, marginBottom: SPACING.md },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.md },
  tabBtnActive: { backgroundColor: '#fff' },
  tabBtnText: { fontSize: FONTS.sizes.sm, color: '#666', ...FONTS.semibold },
  tabBtnTextActive: { color: '#000', ...FONTS.bold },

  filtersRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md, alignItems: 'center' },
  filterSelector: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md
  },
  filterSelectorText: { fontSize: FONTS.sizes.xs, color: '#444', ...FONTS.semibold },
  clearFilter: { padding: 4 },

  emptyContainer: { padding: 48, alignItems: 'center', gap: SPACING.sm },
  emptyText: { color: '#666', fontSize: FONTS.sizes.sm, ...FONTS.regular },

  eqCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  eqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  eqName: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000' },
  eqCategory: { fontSize: FONTS.sizes.xs, color: '#666', ...FONTS.semibold, marginTop: 2 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeActive: { backgroundColor: 'rgba(34,197,94,0.1)' },
  badgePending: { backgroundColor: 'rgba(245,158,11,0.1)' },
  badgeExpired: { backgroundColor: 'rgba(239,68,68,0.1)' },
  badgeText: { fontSize: 10, ...FONTS.bold },
  badgeTextActive: { color: COLORS.success },
  badgeTextPending: { color: COLORS.warning },
  badgeTextExpired: { color: '#EF4444' },

  eqInfoRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4 },
  infoCol: { flex: 1, alignItems: 'flex-start' },
  infoLabel: { fontSize: 9, color: '#888', ...FONTS.semibold, textTransform: 'uppercase' },
  infoValue: { fontSize: FONTS.sizes.xs, color: '#333', ...FONTS.semibold, marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md },
  repairBtn: { backgroundColor: COLORS.primary },
  actionBtnText: { color: '#fff', fontSize: 11, ...FONTS.bold },
  actionBtnSecondary: { borderWidth: 1, borderColor: '#E5E7EB', width: 28, height: 28, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },

  logCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: SPACING.md
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  logEqName: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000' },
  logDate: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 2 },
  logCost: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: COLORS.primary },
  logDesc: { fontSize: FONTS.sizes.xs, color: '#444', ...FONTS.regular, marginVertical: 8, lineHeight: 18 },
  logFooter: { flexDirection: 'row', gap: SPACING.xs, marginTop: 4 },
  footerDetail: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
  footerDetailText: { fontSize: 10, color: '#555', ...FONTS.medium },
  deleteLogBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, alignSelf: 'flex-end', marginTop: 8 },
  deleteLogBtnText: { fontSize: 10, color: '#EF4444', ...FONTS.bold },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, maxHeight: height - 100, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: FONTS.sizes.lg, ...FONTS.bold, color: '#000' },

  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { fontSize: FONTS.sizes.xs, ...FONTS.semibold, color: '#444', marginBottom: 6 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: FONTS.sizes.sm, color: '#000', ...FONTS.regular },

  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statusOptionBtn: { borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: '#F9FAFB' },
  statusOptionBtnActive: { borderColor: COLORS.primary, backgroundColor: '#FFF7ED' },
  statusOptionText: { fontSize: FONTS.sizes.xs, color: '#555', ...FONTS.medium },
  statusOptionTextActive: { color: COLORS.primary, ...FONTS.bold },

  submitBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.md },
  submitBtnText: { color: '#fff', fontSize: FONTS.sizes.md, ...FONTS.bold },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: RADIUS.xl, width: width - 80, padding: SPACING.lg },
  pickerTitle: { fontSize: FONTS.sizes.md, ...FONTS.bold, color: '#000', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  pickerOptionText: { fontSize: FONTS.sizes.sm, color: '#333', ...FONTS.medium },
});
