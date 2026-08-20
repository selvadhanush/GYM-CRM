import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { QrCode, Building2, ChevronLeft, Activity } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { fontFamilies } from '@/design-system/tokens';
import { useAuth } from '@/features/auth';
import { useCheckIn, usePartnerGyms, useSessionStatus } from '../api/fitpass.api';
import { GymSelectModal, GymSelectItem } from '@/components/GymSelectModal';

import { parseGymCrmQr } from '@/lib/qr-parser';

type ScanState = 'idle' | 'scanning' | 'processing' | 'done' | 'error';

export function FitPassQRScan() {
  const router = useRouter();
  const { activeDivision } = useAuth();
  const targetDashboard = activeDivision === 'h4' ? '/(h4)/dashboard' : '/(fitpass)/dashboard';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const checkIn = useCheckIn();
  const { data: gyms } = usePartnerGyms();
  const { data: sessionData } = useSessionStatus();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSearch, setManualSearch] = useState('');

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanState !== 'idle') return;
      setScanState('scanning');

      const parsed = parseGymCrmQr(data);

      if (parsed.type === 'IDENTITY') {
        const errorMsg = 'Member Registration QR codes are for physical gym check-in desks, not FitPass partner counters.';
        setErrorMessage(errorMsg);
        setScanState('error');
        Alert.alert('FitPass Counter Check-in', errorMsg, [
          { text: 'Try Again', onPress: () => { setScanState('idle'); setErrorMessage(null); } },
          { text: 'Cancel', onPress: () => router.back() },
        ]);
        return;
      }

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
        await checkIn.mutateAsync({ gymId: parsed.gymId, branchId: parsed.branchId, qrCode: data });

        setScanState('done');
        Alert.alert('✅ Entry Authorized!', 'Your attendance check-in is complete.', [
          { text: 'Go to Dashboard', onPress: () => router.push(targetDashboard as any) },
        ]);
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
    [scanState, checkIn, router, targetDashboard],
  );

  const handleManualCheckIn = async (gym: GymSelectItem) => {
    setIsManualModalOpen(false);
    setScanState('processing');
    try {
      const gymId = gym.id || gym._id;
      const qrCode = JSON.stringify({ gymId, gymName: gym.name });
      await checkIn.mutateAsync({ gymId: gymId as string, qrCode });
      setScanState('done');
      Alert.alert('✅ Entry Authorized', `Checked in at ${gym.name}!`, [
        { text: 'Go to Dashboard', onPress: () => router.push(targetDashboard as any) },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Manual check-in failed.';
      setErrorMessage(msg);
      setScanState('error');
      Alert.alert('Check-in Error', msg, [
        { text: 'OK', onPress: () => setScanState('idle') },
      ]);
    }
  };

  const gymLocations: GymSelectItem[] = (gyms || []).map((g: any) => ({
    id: g.id || g._id,
    _id: g._id,
    name: g.name,
    address: g.address,
  }));

  const manualModal = (
    <GymSelectModal
      visible={isManualModalOpen}
      onClose={() => setIsManualModalOpen(false)}
      locations={gymLocations}
      search={manualSearch}
      onSearchChange={setManualSearch}
      onSelect={handleManualCheckIn}
      badgeText="FITPASS NETWORK"
      title="Select Partner Gym"
      searchPlaceholder="Search gym by name or city..."
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
        <View style={[styles.permIconCircle, { backgroundColor: `${theme.colors.primary}1A`, borderColor: `${theme.colors.primary}4D` }]}>
          <QrCode size={36} color={theme.colors.primary} />
        </View>
        <Text style={[styles.permTitle, { color: theme.colors.text }]}>Camera Access Required</Text>
        <Text style={[styles.permSubtitle, { color: theme.colors.textSecondary }]}>
          FitPass uses your camera to scan partner gym QR codes for attendance check-ins.
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
          style={[styles.manualFallbackBtn, { backgroundColor: `${theme.colors.primary}14`, borderColor: `${theme.colors.primary}40` }]}
          onPress={() => setIsManualModalOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Select gym manually"
        >
          <Building2 size={16} color={theme.colors.primary} />
          <Text style={[styles.manualFallbackText, { color: theme.colors.primary }]}>Select Gym Manually</Text>
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
      {/* Top Header Floating Card */}
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
          <Text style={[styles.headerMainTitle, { color: theme.colors.text }]}>Scan QR Code</Text>
          <Text style={[styles.headerSubTitle, { color: theme.colors.textMuted }]}>FitPass Express Attendance</Text>
        </View>

        <View style={[styles.creditPill, { backgroundColor: `${theme.colors.primary}1A`, borderColor: `${theme.colors.primary}40` }]}>
          <Activity size={12} color={theme.colors.primary} />
          <Text style={[styles.creditPillText, { color: theme.colors.primary }]}>{sessionData?.sessionsRemaining ?? 0} LEFT</Text>
        </View>
      </View>

      {/* Main Creative Viewfinder Frame */}
      <View style={styles.scannerViewportFrame}>
        <View style={[styles.cameraClipContainer, { borderColor: theme.colors.primary }]}>
          <CameraView
            style={styles.cameraInstance}
            facing="back"
            onBarcodeScanned={scanState === 'idle' ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            {/* Viewfinder Target Reticle */}
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
            {scanState === 'idle' && 'Align gym counter QR code inside frame'}
            {scanState === 'scanning' && 'Reading FitPass QR code…'}
            {scanState === 'processing' && 'Validating pass & deducting 1 session…'}
            {scanState === 'done' && '✅ Entry Authorized!'}
            {scanState === 'error' && `❌ ${errorMessage ?? 'Check-in failed'}`}
          </Text>
        </View>

        {/* Manual Gym Selection Button */}
        <TouchableOpacity
          style={[styles.manualTriggerBtn, { backgroundColor: `${theme.colors.primary}14`, borderColor: `${theme.colors.primary}40` }]}
          onPress={() => setIsManualModalOpen(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Select gym manually"
        >
          <Building2 size={16} color={theme.colors.primary} />
          <Text style={[styles.manualTriggerText, { color: theme.colors.primary }]}>
            Can't scan QR? Select Gym Manually
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
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubTitle: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    marginTop: 1,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  creditPillText: {
    fontFamily: fontFamilies.header,
    fontSize: 11,
    fontWeight: '800',
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
