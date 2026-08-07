import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Skeleton } from '@/components/ui';
import { useH4Attendance, useH4CheckIn } from '../api/h4.api';
import { CalendarCheck, QrCode, CheckCircle, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { H4TopHeader } from './H4TopHeader';

export function H4Attendance() {
  const { data, isLoading } = useH4Attendance();
  const records = data?.data ?? [];
  const checkInMutation = useH4CheckIn();
  const router = useRouter();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleMarkAttendance = async () => {
    try {
      await checkInMutation.mutateAsync({});
      setSuccessMsg('Attendance marked successfully! Check-in recorded.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Check-in failed. Please try again or scan QR code.';
      Alert.alert('Attendance Check-In', msg);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <H4TopHeader title="Attendance Log" />
      <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Action Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Typography variant="h2" style={styles.title}>H4 Attendance</Typography>
            <Typography variant="caption" color="secondary" style={styles.subtitle}>
              Mark physical attendance & view check-in history
            </Typography>
          </View>
          <View style={styles.headerIconCircle}>
            <CalendarCheck size={20} color={theme.colors.primary} />
          </View>
        </View>

        {/* Success Banner */}
        {successMsg && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color="#10B981" />
            <Typography variant="bodySm" style={{ color: '#10B981', fontWeight: '800', flex: 1 }}>
              {successMsg}
            </Typography>
          </View>
        )}

        {/* Mark Attendance & Scan Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.markBtn}
            onPress={handleMarkAttendance}
            disabled={checkInMutation.isPending}
            activeOpacity={0.85}
          >
            {checkInMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <CheckCircle size={16} color="#FFFFFF" />
                <Typography variant="bodySm" style={styles.markBtnText}>Mark Present</Typography>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/(h4)/scan' as any)}
            activeOpacity={0.85}
          >
            <QrCode size={16} color={theme.colors.primary} />
            <Typography variant="bodySm" style={styles.scanBtnText}>Scan QR</Typography>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Attendance History Section */}
      <View style={styles.sectionHeader}>
        <Typography variant="h3" style={{ color: theme.colors.text }}>Check-in Records</Typography>
        <Typography variant="caption" color="secondary">{records.length} Total Visits</Typography>
      </View>

      {isLoading ? (
        [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} style={styles.skeleton} />)
      ) : records.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Typography variant="bodySm" color="secondary">No attendance records found yet.</Typography>
        </Card>
      ) : (
        records.map((rec) => (
          <Card key={rec.id} style={styles.row}>
            <View style={styles.dot} />
            <View style={{ flex: 1 }}>
              <Typography variant="bodySm" style={{ fontWeight: '800', color: theme.colors.text }}>
                {new Date(rec.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Typography>
              <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                {!rec.gymName || rec.gymName === 'Partner Gym' || rec.gymName.includes('Partner') ? 'H4 Fitness Gym' : rec.gymName}
              </Typography>
            </View>

            <View style={styles.timeBadge}>
              <ShieldCheck size={13} color="#10B981" />
              <Typography variant="caption" style={{ fontWeight: '800', color: theme.colors.text }}>
                {rec.checkInTime}
              </Typography>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 100, gap: 16 },
  
  headerCard: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
    gap: 14,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { color: theme.colors.text, marginBottom: 2, fontWeight: '900' },
  subtitle: { color: theme.colors.textSecondary },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.brandMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 95, 31, 0.25)',
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },

  btnRow: { flexDirection: 'row', gap: 10 },
  markBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  markBtnText: { color: '#FFFFFF', fontWeight: '800' },
  scanBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 95, 31, 0.08)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanBtnText: { color: theme.colors.primary, fontWeight: '800' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.bgTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyCard: { padding: 16, alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  skeleton: { height: 60, borderRadius: 16 },
});
