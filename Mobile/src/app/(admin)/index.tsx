import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { adminService } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import type { DashboardStats } from '@/types';

import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const user = useAuthStore(state => state.user);

  const fetchStats = useCallback(async () => {
    const { token } = useAuthStore.getState();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      if (!error?.message?.includes('not authorized')) {
        console.warn('Fetch Stats Error:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const qrData = JSON.stringify({ gymId: user?.gymId, gymName: user?.gymName || 'Partner Gym' });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Here is the Check-In link for ${user?.gymName || 'our gym'}. Show this QR at the desk: ${qrUrl}`,
        url: qrUrl,
        title: 'Gym Check-In QR Link'
      });
    } catch (error) {
      console.error('Share Link Error:', error);
    }
  };

  const handleShareImage = async () => {
    try {
      setSharingImage(true);
      const fileUri = FileSystem.cacheDirectory + 'checkin-qr.png';
      
      const { uri } = await FileSystem.downloadAsync(qrUrl, fileUri);
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share QR Image',
          UTI: 'public.png'
        });
      } else {
        Alert.alert('Sharing not available on this device');
      }
    } catch (error) {
      console.error('Share Image Error:', error);
      Alert.alert('Error', 'Failed to share image');
    } finally {
      setSharingImage(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Partner Dashboard</Text>
          <Text style={styles.subtitle}>Gym Overview</Text>
        </View>
        <TouchableOpacity style={styles.qrButton} onPress={() => setShowQR(true)}>
          <Ionicons name="qr-code" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* QR Code Modal */}
      <Modal
        visible={showQR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{user?.gymName || 'Your Gym'}</Text>
            <Text style={styles.modalSubtitle}>Members can scan this to check in</Text>
            
            <View style={styles.qrImageContainer}>
              <Image source={{ uri: qrUrl }} style={styles.qrImage} />
            </View>

            <View style={styles.modalActions}>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity style={[styles.modalBtnShare, { flex: 1 }]} onPress={handleShareImage} disabled={sharingImage}>
                  {sharingImage ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="image" size={18} color="#FFF" />
                      <Text style={styles.modalBtnTextShare}>Image</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtnShare, { flex: 1, backgroundColor: COLORS.success }]} onPress={handleShareLink}>
                  <Ionicons name="link" size={18} color="#FFF" />
                  <Text style={styles.modalBtnTextShare}>Link</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.modalBtnClose} onPress={() => setShowQR(false)}>
                <Text style={styles.modalBtnTextClose}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard
            title="Active Members"
            value={stats?.activeLiveSessions?.length || 0}
            icon="checkmark-circle"
            color={COLORS.success}
          />
          <StatCard
            title="Total Check-Ins Today"
            value={(stats.todayAttendanceCount || 0) + (stats.todaySessionsCount || 0)}
            icon="time"
            color={COLORS.warning}
          />
        </View>
      )}

      {/* Operations Controls Dashboard Grid */}
      <Text style={styles.sectionTitle}>Operations Control</Text>
      <View style={styles.actionGrid}>
        {[
          { icon: 'snow', label: 'Freeze', route: '/(admin)/freeze', color: '#FF7A00', bg: 'rgba(255,122,0,0.1)' },
          { icon: 'funnel', label: 'Leads', route: '/(admin)/leads', color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)' },
          { icon: 'people-circle', label: 'Staff', route: '/(admin)/staff', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
          { icon: 'barbell', label: 'InBody', route: '/(admin)/body-assessments', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { icon: 'calendar', label: 'Attendance', route: '/(admin)/trainer-attendance', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
          { icon: 'wallet', label: 'Payroll', route: '/(admin)/payroll', color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
          { icon: 'analytics', label: 'Analytics', route: '/(admin)/analytics', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { icon: 'business', label: 'Branches', route: '/(admin)/branches', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
          { icon: 'document-text', label: 'Reports', route: '/(admin)/reports', color: '#84CC16', bg: 'rgba(132,204,22,0.1)' },
          { icon: 'construct', label: 'Equipments', route: '/(admin)/equipments', color: '#14B8A6', bg: 'rgba(20,184,166,0.1)' },
          { icon: 'card', label: 'Payments', route: '/(admin)/payments', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
          { icon: 'trending-down', label: 'Expenses', route: '/(admin)/expenses', color: '#F43F5E', bg: 'rgba(244,63,94,0.1)' },
          { icon: 'alert-circle', label: 'Dues', route: '/(admin)/dues', color: '#EAB308', bg: 'rgba(234,179,8,0.1)' },
          { icon: 'school', label: 'Classes', route: '/(admin)/classes', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.actionCard}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {stats?.activeLiveSessions && stats.activeLiveSessions.length > 0 && (
        <View style={styles.liveSessionsContainer}>
          <View style={styles.liveSessionsHeader}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveSectionTitle}>Currently Active Members (Live)</Text>
          </View>
          <Text style={styles.liveSectionSubtitle}>Members currently working out right now.</Text>
          
          <View style={styles.liveSessionsList}>
            {stats.activeLiveSessions.map((session: any) => (
              <View key={session.id} style={styles.liveSessionCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveSessionName}>{session.memberName}</Text>
                  <Text style={styles.liveSessionPhone}>{session.memberPhone}</Text>
                </View>
                <LiveSessionTimer expiresAt={session.expiresAt} />
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: any; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function LiveSessionTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const expiration = new Date(expiresAt);
      const diff = expiration.getTime() - now.getTime();

      if (diff <= 0) {
        return 'Expired';
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const isExpired = timeLeft === 'Expired';
  return (
    <Text style={[styles.timerText, { color: isExpired ? COLORS.danger : COLORS.success }]}>
      {timeLeft}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  qrButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    ...FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONTS.sizes.sm,
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  qrImageContainer: {
    padding: SPACING.md,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  modalActions: {
    width: '100%',
    gap: SPACING.sm,
  },
  modalBtnShare: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  modalBtnTextShare: {
    color: '#FFF',
    ...FONTS.bold,
    fontSize: FONTS.sizes.md,
  },
  modalBtnClose: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  modalBtnTextClose: {
    color: COLORS.textPrimary,
    ...FONTS.bold,
    fontSize: FONTS.sizes.md,
  },
  title: {
    fontSize: FONTS.sizes.title,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginTop: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  financeSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    ...FONTS.semibold,
    marginBottom: SPACING.md,
  },
  financeCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  financeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  financeItem: {
    flex: 1,
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    ...FONTS.medium,
    marginBottom: SPACING.xs,
  },
  financeValue: {
    fontSize: FONTS.sizes.xxl,
    ...FONTS.bold,
  },
  financeDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  liveSessionsContainer: {
    marginBottom: SPACING.xl,
  },
  liveSessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  liveSectionTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    ...FONTS.semibold,
  },
  liveSectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginBottom: SPACING.md,
  },
  liveSessionsList: {
    gap: SPACING.sm,
  },
  liveSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  liveSessionName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  liveSessionPhone: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  timerText: {
    fontSize: FONTS.sizes.lg,
    ...FONTS.bold,
    fontVariant: ['tabular-nums'],
  },
  actionGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginBottom: SPACING.xl,
    marginTop: 6
  },
  actionCard: {
    width: '31%', 
    backgroundColor: '#FFF', 
    borderRadius: RADIUS.xl,
    paddingVertical: 14, 
    paddingHorizontal: 4, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
  },
  actionIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  actionLabel: { 
    color: '#000000', 
    fontSize: 10, 
    ...FONTS.semibold,
    textAlign: 'center'
  },
});
