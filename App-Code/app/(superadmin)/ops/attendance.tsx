import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, useRouter } from 'expo-router';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Select, Button, Modal, EmptyState, Badge, Input } from '@/components/ui';
import { SafeAreaWrapper } from '@/components/layout';
import { useToast } from '@/hooks/useToast';
import { API_CLIENT } from '@/lib/api-client';

let CameraView: any = null;
let useCameraPermissions: any = () => [null, async () => ({ granted: false })];

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExpoCamera = require('expo-camera');
  CameraView = ExpoCamera.CameraView;
  useCameraPermissions = ExpoCamera.useCameraPermissions;
} catch (e) {
  console.warn('expo-camera failed to load:', e);
}

export default function MemberAttendanceScreen() {
  const toast = useToast();
  const router = useRouter();

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedMemberHistory, setSelectedMemberHistory] = useState<{ memberName: string; history: any[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Camera permissions hook
  const [permission, requestPermission] = useCameraPermissions();

  // 1. Query Member List
  const { data: membersList } = useQuery<any[]>({
    queryKey: ['h4-active-members-attendance'],
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/members');
      // Filter Active members
      const allMembers = data.members || data || [];
      return allMembers.filter((m: any) => m.status === 'Active');
    },
  });

  // 2. Query Today's Attendance
  const { data: todayAttendance, isLoading: isTodayLoading, refetch: refetchToday } = useQuery<any[]>({
    queryKey: ['h4-today-attendance'],
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/attendance/today');
      return data || [];
    },
  });

  // 3. Mark Attendance Mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { data } = await API_CLIENT.post('/attendance', { memberId });
      return data;
    },
    onSuccess: () => {
      toast.show('Attendance marked successfully!', 'success');
      setSelectedMemberId('');
      setShowScanner(false);
      refetchToday();
    },
    onError: (err: any) => {
      toast.show(err.response?.data?.message || 'Failed to mark attendance', 'error');
    },
  });

  // Scanner permission and open handler
  const handleStartScanner = async () => {
    if (!CameraView) {
      setShowScanner(true);
      return;
    }
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes.');
        return;
      }
    }
    setShowScanner(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!data) return;
    setShowScanner(false);
    markAttendanceMutation.mutate(data);
  };

  // View Attendance History
  const handleViewHistory = async (member: any) => {
    setLoadingHistory(true);
    try {
      const { data } = await API_CLIENT.get(`/attendance/member/${member._id}`);
      setSelectedMemberHistory({
        memberName: member.name,
        history: data || [],
      });
    } catch {
      toast.show('Failed to fetch attendance history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <SafeAreaWrapper scrollable={false}>
      <Tabs.Screen 
        options={{ 
          title: 'Attendance Tracking',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace('/(superadmin)/ops-hub')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft color={theme.colors.text} size={20} />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {/* Manual Check-in Card */}
          <Card style={styles.actionCard}>
            <Typography variant="body" style={styles.cardHeader}>Manual Check-In</Typography>
            <View style={{ marginBottom: theme.spacing.md }}>
              <Select 
                label=""
                options={(membersList || []).map((m: any) => ({ label: `${m.name} (${m.phone})`, value: m._id }))}
                value={selectedMemberId}
                onValueChange={(val) => setSelectedMemberId(String(val))}
                placeholder="Select Member"
              />
            </View>
            <Button 
              title="Mark Check-In"
              disabled={!selectedMemberId}
              loading={markAttendanceMutation.isPending}
              onPress={() => markAttendanceMutation.mutate(selectedMemberId)}
              style={styles.checkInBtn}
            />
          </Card>

          {/* QR Attendance Card */}
          <Card style={StyleSheet.flatten([styles.actionCard, { alignItems: 'center', justifyContent: 'center' }])}>
            <Typography variant="body" style={[styles.cardHeader, { textAlign: 'center' }]}>QR Attendance</Typography>
            <Typography variant="caption" color="secondary" style={styles.qrDesc}>
              Scan member QR code to mark attendance automatically.
            </Typography>
            <Button 
              title={showScanner ? "Stop Scanner" : "📱 Start QR Scanner"}
              onPress={() => {
                if (showScanner) {
                  setShowScanner(false);
                } else {
                  handleStartScanner();
                }
              }}
              style={showScanner ? styles.stopScannerBtn : styles.startScannerBtn}
            />
          </Card>
        </View>

        {/* Live Camera Scanner Box */}
        {showScanner && (
          <Card style={styles.scannerCard}>
            <Typography variant="bodySm" style={{ fontWeight: '700', marginBottom: theme.spacing.sm }}>
              {CameraView ? "Scanning Member QR Code..." : "QR Scanner Fallback (Input ID)"}
            </Typography>
            {CameraView ? (
              <View style={styles.cameraContainer}>
                <CameraView 
                  style={StyleSheet.absoluteFill} 
                  onBarcodeScanned={handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                <Typography variant="caption" color="secondary" style={{ marginBottom: theme.spacing.sm }}>
                  Camera module not linked in current dev bundle.
                </Typography>
                <Input 
                  label="Enter Member ID Manually"
                  value={selectedMemberId}
                  onChangeText={setSelectedMemberId}
                  placeholder="Paste or type member ID"
                />
                <Button 
                  title="Check In Manually"
                  disabled={!selectedMemberId}
                  loading={markAttendanceMutation.isPending}
                  onPress={() => {
                    markAttendanceMutation.mutate(selectedMemberId);
                  }}
                  style={{ marginTop: theme.spacing.sm }}
                />
              </View>
            )}
          </Card>
        )}

        {/* Today's Attendance Table list */}
        <Typography variant="h3" style={styles.sectionHeader}>Today's Attendance</Typography>

        {isTodayLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.lg }} />
        ) : (todayAttendance || []).length === 0 ? (
          <EmptyState 
            iconText="📋"
            title="No Attendance Marked Today"
            description="Check in members manually or scan their QR codes to start."
          />
        ) : (
          <Card style={{ padding: 0 }}>
            {(todayAttendance || []).map((att: any, idx: number) => {
              const member = att.memberId;
              return (
                <View 
                  key={att._id || idx} 
                  style={[
                    styles.attRow, 
                    idx === (todayAttendance || []).length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={{ flex: 1.5 }}>
                    <Typography variant="bodySm" style={{ fontWeight: '700' }}>
                      {member?.name || 'Scan Check-in'}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {member?.phone || 'N/A'}
                    </Typography>
                  </View>
                  <View style={styles.timeCol}>
                    <Badge label={att.checkInTime} variant="active" />
                  </View>
                  <View style={styles.actionsCol}>
                    <TouchableOpacity 
                      onPress={() => handleViewHistory(member)}
                      style={styles.historyBtn}
                      disabled={loadingHistory}
                    >
                      <Typography variant="caption" style={styles.historyBtnText}>History</Typography>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>

      {/* MEMBER ATTENDANCE HISTORY MODAL */}
      <Modal 
        visible={!!selectedMemberHistory} 
        onClose={() => setSelectedMemberHistory(null)} 
        title={`Attendance History - ${selectedMemberHistory?.memberName}`}
      >
        <ScrollView style={{ maxHeight: 300 }}>
          {(selectedMemberHistory?.history || []).length === 0 ? (
            <Typography variant="caption" color="secondary" style={{ textAlign: 'center', marginVertical: theme.spacing.md }}>
              No check-in history found for this member.
            </Typography>
          ) : (
            (selectedMemberHistory?.history || []).map((hist: any, idx: number) => (
              <View key={hist._id || idx} style={styles.historyRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <Calendar size={14} color={theme.colors.textSecondary} />
                  <Typography variant="bodySm">
                    {new Date(hist.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </Typography>
                </View>
                <Badge label={hist.checkInTime} variant="active" />
              </View>
            ))
          )}
        </ScrollView>
      </Modal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionCard: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'flex-start',
  },
  cardHeader: {
    fontWeight: '800',
    marginBottom: theme.spacing.md,
  },
  checkInBtn: {
    backgroundColor: '#adff2f', // Web neon green color
    height: 40,
    minHeight: 40,
  },
  startScannerBtn: {
    backgroundColor: '#adff2f',
    height: 40,
    minHeight: 40,
    width: '100%',
  },
  stopScannerBtn: {
    backgroundColor: '#ef4444',
    height: 40,
    minHeight: 40,
    width: '100%',
  },
  qrDesc: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    minHeight: 36,
  },
  scannerCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  cameraContainer: {
    width: '100%',
    height: 200,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  sectionHeader: {
    fontWeight: '800',
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  attRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  timeCol: {
    flex: 1,
    alignItems: 'center',
  },
  actionsCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  historyBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgTertiary,
  },
  historyBtnText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
});
