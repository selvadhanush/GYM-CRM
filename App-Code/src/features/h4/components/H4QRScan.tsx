import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Dumbbell, ChevronLeft } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { fontFamilies } from '@/design-system/tokens';
import { useH4CheckIn, useH4IdentityCheckIn, useH4Dashboard } from '../api/h4.api';
import { useQuery } from '@tanstack/react-query';
import { API_CLIENT } from '@/lib/api-client';
import { H4_GYM_IDS } from '@/lib/gym-constants';
import { GymSelectModal, GymSelectItem } from '@/components/GymSelectModal';
import { parseGymCrmQr } from '@/lib/qr-parser';

type ScanState = 'idle' | 'scanning' | 'processing' | 'done' | 'error';

export function H4QRScan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const checkInMutation = useH4CheckIn();
  const identityCheckInMutation = useH4IdentityCheckIn();
  const { data: dashboardData } = useH4Dashboard();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSearch, setManualSearch] = useState('');

  // Fetch gyms and filter STRICTLY for H4 Gyms & Branches only
  const { data: h4GymsList } = useQuery<GymSelectItem[]>({
    queryKey: ['h4-gyms-and-branches-only'],
    queryFn: async () => {
      try {
        const { data } = await API_CLIENT.get('/member-portal/gyms');
        const all = Array.isArray(data) ? data : data?.data ?? [];
        // Filter strictly for H4 gyms or H4 branches
        const h4Only = all.filter((g: any) =>
          (g.name && g.name.toLowerCase().includes('h4')) ||
          g.isBranch === true
        );
        return h4Only;
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const memberHomeGymName = dashboardData?.member?.gymName || 'H4 Fitness Main Flagship Gym';
  const memberHomeGymId = dashboardData?.member?.gymId || H4_GYM_IDS[1];

  // Consolidated H4 Gym List — always includes registered Home Gym at top
  const h4Locations: GymSelectItem[] = [
    {
      id: memberHomeGymId,
      name: memberHomeGymName,
      address: 'H4 Main Fitness Center & Headquarters',
      isHomeGym: true,
    },
    ...(h4GymsList || []).filter(g => g.id !== memberHomeGymId && g._id !== memberHomeGymId),
  ];

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanState !== 'idle') return;
      setScanState('scanning');

      const parsed = parseGymCrmQr(data);

      if (parsed.type === 'INVALID') {
        setErrorMessage(parsed.reason);
        setScanState('error');
        Alert.alert('Unsupported QR Code', parsed.reason, [
          { text: 'Try Again', onPress: () => { setScanState('idle'); setErrorMessage(null); } },
          { text: 'Cancel', onPress: () => router.back() },
        ]);
        return;
      }

      setScanState('processing');

      try {
        if (parsed.type === 'IDENTITY') {
          // Route to identity attendance endpoint (POST /api/v1/attendance/checkin-identity)
          const result = await identityCheckInMutation.mutateAsync({
            identityInput: parsed.registrationNumber,
          });

          setScanState('done');
          Alert.alert(
            '✅ H4 Attendance Marked!',
            `Registration Identity ${parsed.registrationNumber} verified. Attendance recorded successfully.`,
            [{ text: 'Go to Dashboard', onPress: () => router.push('/(h4)/dashboard') }]
          );
        } else if (parsed.type === 'GYM_LOCATION') {
          // Route to FitPass / Gym counter session endpoint (POST /api/v1/member-portal/sessions/check-in)
          await checkInMutation.mutateAsync({
            gymId: parsed.gymId,
            branchId: parsed.branchId,
            qrCode: data,
          });

          setScanState('done');
          Alert.alert(
            '✅ Entry Authorized!',
            'Gym location session check-in authorized successfully.',
            [{ text: 'Go to Dashboard', onPress: () => router.push('/(h4)/dashboard') }]
          );
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Check-in failed. Please try again.';
        setErrorMessage(msg);
        setScanState('error');
        Alert.alert('Check-in Failed', msg, [
          { text: 'Try Again', onPress: () => { setScanState('idle'); setErrorMessage(null); } },
          { text: 'Cancel', onPress: () => router.back() },
        ]);
      }
    },
    [scanState, checkInMutation, identityCheckInMutation, router],
  );

  const handleManualCheckIn = async (gym: GymSelectItem) => {
    setIsManualModalOpen(false);
    setScanState('processing');
    try {
      const gymId = gym.id || gym._id || memberHomeGymId;
      const qrCode = JSON.stringify({ gymId, gymName: gym.name, source: 'manual_h4_select' });
      await checkInMutation.mutateAsync({ gymId, qrCode });
      setScanState('done');
      Alert.alert('✅ H4 Attendance Marked', `Checked in at ${gym.name}!`, [
        { text: 'Go to Dashboard', onPress: () => router.push('/(h4)/dashboard') },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Manual attendance check-in failed.';
      setErrorMessage(msg);
      setScanState('error');
      Alert.alert('Attendance Error', msg, [
        { text: 'OK', onPress: () => setScanState('idle') },
      ]);
    }
  };

  const manualModal = (
    <GymSelectModal
      visible={isManualModalOpen}
      onClose={() => setIsManualModalOpen(false)}
      locations={h4Locations}
      search={manualSearch}
      onSearchChange={setManualSearch}
      onSelect={handleManualCheckIn}
      badgeText="H4 FITNESS BRANCHES ONLY"
      title="Select H4 Branch / Gym"
      searchPlaceholder="Search H4 location by branch name..."
      accentColor={theme.colors.primary}
    />
  );

  if (!permission) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.permSubtitle, { color: theme.colors.textSecondary }]}>Requesting camera permission…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.permIconCircle, { backgroundColor: `${theme.colors.primary}1F`, borderColor: `${theme.colors.primary}59` }]}>
          <Dumbbell size={36} color={theme.colors.primary} />
        </View>
        <Text style={[styles.permTitle, { color: theme.colors.text }]}>Camera Access Required</Text>
        <Text style={[styles.permSubtitle, { color: theme.colors.textSecondary }]}>
          H4 Fitness uses your camera to scan H4 gym QR codes for instant attendance check-ins.
        </Text>
        <TouchableOpacity
          style={[styles.grantBtn, { backgroundColor: theme.colors.primary }]}
          onPress={requestPermission}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Grant camera access"
        >
          <Text style={styles.grantBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.manualFallbackBtn, { backgroundColor: `${theme.colors.primary}1A`, borderColor: `${theme.colors.primary}40` }]}
          onPress={() => setIsManualModalOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Select H4 branch manually"
        >
          <Dumbbell size={16} color={theme.colors.primary} />
          <Text style={[styles.manualFallbackText, { color: theme.colors.primary }]}>Select H4 Branch Manually</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.goBackText, { color: theme.colors.textMuted }]}>Go Back</Text>
        </TouchableOpacity>

        {manualModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.topHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.backCircleBtn, { backgroundColor: theme.colors.bgTertiary, borderColor: theme.colors.border }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerMainTitle, { color: theme.colors.text }]}>H4 Attendance QR</Text>
          <Text style={[styles.headerSubTitle, { color: theme.colors.textMuted }]}>Physical Entry & Attendance Check-in</Text>
        </View>

        <View style={[styles.brandBadge, { backgroundColor: `${theme.colors.primary}1F`, borderColor: `${theme.colors.primary}4D` }]}>
          <Dumbbell size={13} color={theme.colors.primary} />
          <Text style={[styles.brandBadgeText, { color: theme.colors.primary }]}>H4</Text>
        </View>
      </View>

      {/* Main Reticle Viewfinder Frame */}
      <View style={styles.scannerViewportFrame}>
        <View style={[styles.cameraClipContainer, { borderColor: theme.colors.primary }]}>
          <CameraView
            style={styles.cameraInstance}
            facing="back"
            onBarcodeScanned={scanState === 'idle' ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            {/* Viewfinder Reticle */}
            <View style={styles.viewfinderCenter}>
              <View style={[styles.corner, styles.cornerTL, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: theme.colors.primary }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: theme.colors.primary }]} />
              <View style={[styles.laserLine, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} />
            </View>
          </CameraView>
        </View>
      </View>

      {/* Bottom Action Sheet Card */}
      <View style={[styles.bottomCardContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.statusIndicatorRow, { backgroundColor: theme.colors.bgTertiary, borderColor: theme.colors.border }]}>
          <View
            style={[
              styles.statusPulseDot,
              {
                backgroundColor:
                  scanState === 'error'
                    ? theme.colors.error
                    : scanState === 'done'
                    ? theme.colors.success
                    : theme.colors.primary,
              },
            ]}
          />
          <Text style={[styles.scanStatusText, { color: theme.colors.text }]}>
            {scanState === 'idle' && 'Align H4 gym counter QR code inside frame'}
            {scanState === 'scanning' && 'Reading H4 attendance QR code…'}
            {scanState === 'processing' && 'Validating H4 athlete access…'}
            {scanState === 'done' && '✅ H4 Attendance Marked!'}
            {scanState === 'error' && `❌ ${errorMessage ?? 'Check-in failed'}`}
          </Text>
        </View>

        {/* Manual Gym Selection Button */}
        <TouchableOpacity
          style={[styles.manualTriggerBtn, { backgroundColor: `${theme.colors.primary}1A`, borderColor: `${theme.colors.primary}4D` }]}
          onPress={() => setIsManualModalOpen(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Select H4 branch manually"
        >
          <Dumbbell size={16} color={theme.colors.primary} />
          <Text style={[styles.manualTriggerText, { color: theme.colors.primary }]}>
            Can't scan? Select H4 Branch Manually
          </Text>
        </TouchableOpacity>
      </View>

      {manualModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  permIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permTitle: {
    fontFamily: fontFamilies.header,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  permSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 20,
  },
  grantBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    minHeight: 44,
  },
  grantBtnText: {
    fontFamily: fontFamilies.header,
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  manualFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    minHeight: 44,
  },
  manualFallbackText: {
    fontFamily: fontFamilies.header,
    fontSize: 14,
    fontWeight: '800',
  },
  goBackBtn: { paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  goBackText: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    fontWeight: '600',
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerMainTitle: {
    fontFamily: fontFamilies.header,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubTitle: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    marginTop: 1,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  brandBadgeText: {
    fontFamily: fontFamilies.header,
    fontSize: 11,
    fontWeight: '900',
  },

  scannerViewportFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 14,
  },
  cameraClipContainer: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 3,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cameraInstance: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderCenter: {
    width: 210,
    height: 210,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderWidth: 4 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
  laserLine: {
    width: '90%',
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  bottomCardContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusPulseDot: { width: 8, height: 8, borderRadius: 4 },
  scanStatusText: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  manualTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
  },
  manualTriggerText: {
    fontFamily: fontFamilies.header,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
