import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '@/theme';
import { api } from '@/services/api';

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get<{logs: any[]}>('/audit');
      setLogs(data.logs || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('LOGIN')) return '#059669'; // Green
    if (action.includes('UPDATE')) return '#D97706'; // Orange/Yellow
    if (action.includes('DELETE')) return '#DC2626'; // Red
    return COLORS.primary;
  };

  const renderLogCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.actionBadge}>
          <View style={[styles.dot, { backgroundColor: getActionColor(item.action) }]} />
          <Text style={[styles.actionText, { color: getActionColor(item.action) }]}>
            {item.action}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </View>
      
      <Text style={styles.descriptionText}>{item.details}</Text>
      
      <View style={styles.footerRow}>
        <View style={styles.entityTag}>
          <Ionicons name="cube-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
          <Text style={styles.entityText}>{item.entity} {item.entityId ? `#${item.entityId.slice(-4)}` : ''}</Text>
        </View>
        <View style={styles.userTag}>
          <Ionicons name="person-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
          <Text style={styles.userText}>{item.targetName || 'System User'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>System Audit</Text>
          <Text style={styles.subtitle}>Global action and event logs</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchLogs}>
          <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderLogCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.textMuted} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyText}>No audit logs found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16,
  },
  title: { ...FONTS.bold, fontSize: 28, color: '#1A1C1E' },
  subtitle: { ...FONTS.regular, fontSize: 14, color: '#6B7280', marginTop: 4 },
  refreshBtn: {
    padding: 10, backgroundColor: '#FFFFFF', borderRadius: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    ...SHADOWS.sm,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  actionBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  actionText: { ...FONTS.bold, fontSize: 11, letterSpacing: 0.5 },
  timeText: { ...FONTS.medium, fontSize: 12, color: '#9CA3AF' },
  descriptionText: {
    ...FONTS.medium, fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12
  },
  footerRow: {
    flexDirection: 'row', gap: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12
  },
  entityTag: { flexDirection: 'row', alignItems: 'center' },
  entityText: { ...FONTS.medium, fontSize: 12, color: '#6B7280' },
  userTag: { flexDirection: 'row', alignItems: 'center' },
  userText: { ...FONTS.medium, fontSize: 12, color: '#6B7280' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
  emptyText: { ...FONTS.medium, color: '#9CA3AF', fontSize: 15 },
});
