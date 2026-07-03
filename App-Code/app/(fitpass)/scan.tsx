import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Button } from '@/components/ui';
import { useCheckIn } from '@/features/fitpass';

type ScanState = 'idle' | 'scanning' | 'processing' | 'done' | 'error';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const checkIn = useCheckIn();

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanState !== 'idle') return; // block re-scans while processing
      setScanState('scanning');

      try {
        // QR payload format: JSON { gymId, branchId }
        const payload = JSON.parse(data) as { gymId: string; branchId?: string };
        if (!payload?.gymId) throw new Error('Invalid QR code — missing gymId');

        setScanState('processing');
        await checkIn.mutateAsync({ gymId: payload.gymId, branchId: payload.branchId, qrCode: data });

        setScanState('done');
        Alert.alert('✅ Check-in Successful', 'Your session has started!', [
          { text: 'OK', onPress: () => router.back() },
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
    [scanState, checkIn, router],
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <Typography variant="body" color="secondary">Requesting camera permission…</Typography>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Typography variant="h3" style={styles.permTitle}>Camera Access Required</Typography>
        <Typography variant="bodySm" color="secondary" style={styles.permSubtitle}>
          We need camera access to scan gym QR codes.
        </Typography>
        <Button title="Allow Camera" onPress={requestPermission} style={styles.permBtn} />
        <Button title="Go Back" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanState === 'idle' ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        {/* Close button */}
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            accessibilityLabel="Close Scanner"
          >
            <X size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Viewfinder */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder} />
        </View>

        {/* Status text */}
        <View style={styles.bottomOverlay}>
          <Typography variant="h3" style={styles.scanLabel}>
            {scanState === 'idle' && 'Point camera at gym QR code'}
            {scanState === 'scanning' && 'Reading QR…'}
            {scanState === 'processing' && 'Checking in…'}
            {scanState === 'done' && '✅ Success!'}
            {scanState === 'error' && `❌ ${errorMessage ?? 'Failed'}`}
          </Typography>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  permTitle: { color: theme.colors.text, marginBottom: theme.spacing.sm, textAlign: 'center' },
  permSubtitle: { textAlign: 'center', marginBottom: theme.spacing.xl },
  permBtn: { marginBottom: theme.spacing.md },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
    backgroundColor: 'transparent',
  },
  bottomOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  scanLabel: {
    color: theme.colors.text,
    textAlign: 'center',
  },
});
