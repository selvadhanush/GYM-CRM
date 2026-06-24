import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import type { DashboardStats } from '@/types';

export default function AdminMembersScreen() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('month');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkins, setCheckins] = useState<any[]>([]);

  const fetchMembers = useCallback(async () => {
    const { token } = useAuthStore.getState();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await adminService.getHistory(period, period === 'custom' ? customDate : undefined);
      if (response.success) {
        setCheckins(response.data);
      }
    } catch (error: any) {
      if (!error?.message?.includes('not authorized')) {
        console.warn('Fetch History Error:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, customDate]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const handleSearch = (text: string) => {
    setSearch(text);
  };

  const filteredCheckins = checkins.filter(c => 
    c.memberName.toLowerCase().includes(search.toLowerCase()) || 
    c.memberPhone?.includes(search)
  );

  const renderCheckin = ({ item }: { item: any }) => {
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.memberName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.memberName}</Text>
            <Text style={styles.memberContact}>{item.memberPhone}</Text>
          </View>
        </View>
        
        <View style={styles.planDetails}>
          <View style={styles.planRow}>
            <Ionicons name="calendar" size={14} color={COLORS.textMuted} />
            <Text style={styles.planText}>
              {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.planRow}>
            <Ionicons name="time" size={14} color={COLORS.textMuted} />
            <Text style={styles.planText}>{item.checkInTime}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={{ gap: SPACING.sm }}>
          {['today', 'yesterday', 'week', 'month', 'year', 'custom'].map(p => (
            <TouchableOpacity 
              key={p} 
              style={[styles.filterChip, period === p && styles.filterChipActive]}
              onPress={() => {
                if (p === 'custom') {
                  setShowDatePicker(true);
                } else {
                  setPeriod(p);
                }
              }}
            >
              <Text style={[styles.filterChipText, period === p && styles.filterChipTextActive]}>
                {p === 'custom' ? 'Custom Date' : p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Specific Date</Text>
            <Text style={styles.modalSubtitle}>Format: YYYY-MM-DD</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="e.g. 2024-03-15"
              placeholderTextColor={COLORS.textMuted}
              value={customDate}
              onChangeText={setCustomDate}
              keyboardType="number-pad"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnApply} onPress={() => {
                setPeriod('custom');
                setShowDatePicker(false);
              }}>
                <Text style={styles.modalBtnTextApply}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCheckins}
          keyExtractor={(item) => item.id}
          renderItem={renderCheckin}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No check-ins this month.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.backgroundDark,
  },
  title: {
    fontSize: FONTS.sizes.title,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginBottom: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    ...FONTS.regular,
  },
  clearBtn: {
    padding: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: 100,
  },
  memberCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    ...FONTS.bold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    ...FONTS.semibold,
  },
  memberContact: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    ...FONTS.regular,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    ...FONTS.semibold,
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  planText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    ...FONTS.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.md,
    ...FONTS.medium,
    marginTop: SPACING.md,
  },
  filterContainer: {
    marginTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundInput,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    ...FONTS.medium,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    ...FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: FONTS.sizes.sm,
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  dateInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...FONTS.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalBtnTextCancel: {
    color: COLORS.textPrimary,
    ...FONTS.semibold,
    fontSize: FONTS.sizes.md,
  },
  modalBtnApply: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalBtnTextApply: {
    color: '#FFF',
    ...FONTS.semibold,
    fontSize: FONTS.sizes.md,
  },
});
