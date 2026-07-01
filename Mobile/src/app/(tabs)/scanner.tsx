import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Dimensions, Animated, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '@/stores/session';
import { memberService } from '@/services/member';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';

const { width, height } = Dimensions.get('window');
type Phase = 'ready' | 'scanning' | 'scanned' | 'verifying' | 'active' | 'success';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('ready');
  const [scannedGymName, setScannedGymName] = useState('');
  const [timerText, setTimerText] = useState('');
  const [torch, setTorch] = useState(false);
  // The parsed gymId from the most recent scan, kept for the check-in call.
  const scannedGymIdRef = useRef<string>('');
  const laserAnim = useRef(new Animated.Value(0)).current;
  const { active, hydrate, applyCheckIn, applyStatus, getRemainingSeconds, clear } = useSessionStore();

  // On mount: hydrate any persisted active session so the timer survives restart.
  useEffect(() => {
    (async () => {
      await hydrate();
      // Also sync with the server in case the session expired while away.
      try {
        const status = await memberService.getSessionStatus();
        await applyStatus(status);
      } catch { /* offline tolerance */ }
      if (useSessionStore.getState().active) setPhase('active');
    })();
  }, []);

  // Live countdown for the active session. Derived from the server's sessionEndsAt
  // (via the store), so device clock skew can't grant extra time.
  useEffect(() => {
    if (!active) return;
    setPhase('active');
    const tick = () => {
      const s = getRemainingSeconds();
      setTimerText(
        `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
      );
      if (s <= 0) {
        // Session ended by the server-configured duration. No checkout step.
        clear();
        setPhase('ready');
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [active]);

  // Laser scanner animation
  useEffect(() => {
    if (phase === 'scanning') {
      laserAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 238,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [phase]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (phase !== 'scanning') return;
    setPhase('scanned');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // QR payload is { gymId, gymName } JSON (as produced by the web admin).
    let gymId = '';
    let gymName = 'Partner Gym';
    let branchId = '';
    try {
      const p = JSON.parse(data);
      gymId = p.gymId || '';
      gymName = p.gymName || 'Partner Gym';
      branchId = p.branchId || '';
    } catch {
      gymId = data; // fallback: raw string is the gymId
    }
    if (!gymId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid QR', 'This QR code is not a valid gym check-in code.');
      setPhase('ready');
      return;
    }
    scannedGymIdRef.current = gymId;
    setScannedGymName(gymName);
    doCheckIn(gymId, branchId);
  };

  // Call the server check-in endpoint. The server atomically deducts 1 session,
  // sets the active session + cooldown, and returns the authoritative end time.
  const doCheckIn = async (gymId: string, branchId?: string) => {
    setPhase('verifying');
    try {
      const deviceInfo = `${Platform.OS} ${Platform.Version}`;
      const res = await memberService.checkIn(gymId, branchId, deviceInfo);
      await applyCheckIn({
        sessionEndsAt: res.sessionEndsAt,
        cooldownEndsAt: res.cooldownEndsAt,
        sessionsRemaining: res.sessionsRemaining,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('active');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // The server returns precise gate errors (402/409/429). ApiError carries
      // the HTTP status + parsed body so we can branch + message precisely.
      const status = error?.status;
      const body = error?.body || {};
      const msg = error?.message || 'Check-in failed.';
      if (status === 402) {
        Alert.alert('No Sessions', 'You have no sessions remaining. Buy a plan to check in.');
      } else if (status === 409) {
        const endsAt = body?.sessionEndsAt ? new Date(body.sessionEndsAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
        Alert.alert('Already Checked In', endsAt ? `Your active session ends at ${endsAt}.` : 'You already have an active session.');
        // Reflect the active session in the UI.
        try {
          const s = await memberService.getSessionStatus();
          await applyStatus(s);
          setPhase('active');
        } catch { setPhase('ready'); }
        return;
      } else if (status === 429) {
        const cd = body?.cooldownEndsAt ? new Date(body.cooldownEndsAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
        Alert.alert('Cooldown Active', cd ? `You can check in again after ${cd}.` : 'You can check in again after the 3-hour cooldown ends.');
        // Reflect the cooldown.
        try {
          const s = await memberService.getSessionStatus();
          await applyStatus(s);
        } catch {}
        setPhase('ready');
        return;
      } else {
        Alert.alert('Check-in Failed', msg);
      }
      setPhase('ready');
    }
  };

  if (!permission) return (
    <View style={styles.base}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  );

  if (!permission.granted) return (
    <View style={styles.base}>
      <View style={styles.permBox}>
        <View style={styles.permIcon}>
          <Ionicons name="camera" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.permTitle}>Camera Permission</Text>
        <Text style={styles.permSub}>We need camera access to scan gym QR codes for check-in</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.8}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.permBtnGrad}>
            <Text style={styles.permBtnText}>Grant Access</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (phase === 'verifying') return (
    <View style={styles.base}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.verifyText}>Checking in...</Text>
    </View>
  );

  if (phase === 'active') return (
    <View style={styles.base}>
      <LinearGradient colors={['rgba(34,197,94,0.1)', 'transparent']} style={styles.activeBg} />
      <View style={styles.activeContent}>
        <View style={styles.activePulse}>
          <View style={styles.activePulseInner}>
            <Ionicons name="fitness" size={40} color={COLORS.success} />
          </View>
        </View>
        <Text style={styles.activeLabel}>WORKOUT IN PROGRESS</Text>
        <Text style={styles.activeGym}>{scannedGymName || 'Gym'}</Text>
        <Text style={styles.activeTimer}>{timerText}</Text>
        <Text style={styles.activeTimerLbl}>remaining in this session</Text>
        <Text style={styles.activeNote}>Your session ends automatically — no checkout needed.</Text>
      </View>
    </View>
  );

  if (phase === 'scanning') return (
    <View style={styles.base}>
      <CameraView 
        style={styles.camera} 
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }} 
        onBarcodeScanned={handleBarCodeScanned}
        enableTorch={torch}
      >
        <View style={styles.overlay}>
          <Text style={styles.scanHint}>Point at the gym's QR code</Text>
          <View style={styles.frame}>
            {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
              <View key={i} style={[styles.corner, pos,
                i < 2 ? { borderTopWidth: 3 } : { borderBottomWidth: 3 },
                i % 2 === 0 ? { borderLeftWidth: 3 } : { borderRightWidth: 3 },
              ]} />
            ))}
            <Animated.View style={[
              styles.laserLine,
              {
                transform: [{ translateY: laserAnim }]
              }
            ]} />
          </View>
          <Text style={styles.scanSub}>1 session is deducted instantly on scan</Text>
        </View>
      </CameraView>
      <TouchableOpacity style={styles.closeBtn} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPhase('ready');
      }}>
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.torchBtn} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTorch(!torch);
      }}>
        <Ionicons name={torch ? "flash" : "flash-off"} size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Ready state
  return (
    <View style={styles.base}>
      <LinearGradient colors={['rgba(255,122,0,0.08)', 'transparent']} style={styles.readyBg} />
      <View style={styles.readyContent}>
        <View style={styles.qrIconWrap}>
          <LinearGradient colors={['rgba(255,122,0,0.2)', 'rgba(255,122,0,0.05)']} style={styles.qrIconBg}>
            <Ionicons name="qr-code" size={72} color={COLORS.primary} />
          </LinearGradient>
        </View>
        <Text style={styles.readyTitle}>Check In</Text>
        <Text style={styles.readySub}>Scan the QR code at any partner gym to start your workout session</Text>
        <TouchableOpacity 
          style={styles.scanBtn} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTorch(false);
            setPhase('scanning');
          }} 
          activeOpacity={0.8}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.scanBtnGrad}>
            <Ionicons name="scan" size={22} color="#fff" />
            <Text style={styles.scanBtnText}>Open Scanner</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.infoRow}>
          {[
            { icon: 'ticket', text: `${useSessionStore.getState().sessionsRemaining} sessions` },
            { icon: 'shield-checkmark', text: 'Secure' },
            { icon: 'time', text: 'Auto-ends' },
          ].map((item) => (
            <View key={item.text} style={styles.infoPill}>
              <Ionicons name={item.icon as any} size={12} color={COLORS.textMuted} />
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  camera: { width, height },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  frame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: COLORS.primary, borderRadius: 3 },
  scanHint: { color: '#fff', fontSize: FONTS.sizes.lg, ...FONTS.semibold, marginBottom: SPACING.xl, letterSpacing: -0.3 },
  scanSub: { color: 'rgba(255,255,255,0.5)', fontSize: FONTS.sizes.sm, ...FONTS.regular, marginTop: SPACING.xl },

  closeBtn: {
    position: 'absolute', top: 56, right: 20, width: 44, height: 44,
    borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },

  readyBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  readyContent: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  qrIconWrap: { marginBottom: SPACING.xl },
  qrIconBg: { width: 140, height: 140, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)' },
  readyTitle: { fontSize: FONTS.sizes.title, color: '#000000', ...FONTS.bold, letterSpacing: -0.5, marginBottom: SPACING.sm },
  readySub: { fontSize: FONTS.sizes.md, color: '#666666', textAlign: 'center', lineHeight: 22, ...FONTS.regular, marginBottom: SPACING.xl },
  scanBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', width: '100%', marginBottom: SPACING.lg },
  scanBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: 18, borderRadius: RADIUS.xl },
  scanBtnText: { color: '#fff', fontSize: FONTS.sizes.lg, ...FONTS.bold },
  infoRow: { flexDirection: 'row', gap: SPACING.sm },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#E5E7EB' },
  infoText: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.medium },

  verifyText: { color: '#666666', fontSize: FONTS.sizes.md, ...FONTS.medium, marginTop: SPACING.md },

  activeBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  activeContent: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  activePulse: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(34,197,94,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  activePulseInner: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(34,197,94,0.15)', justifyContent: 'center', alignItems: 'center' },
  activeLabel: { color: COLORS.success, fontSize: FONTS.sizes.xs, ...FONTS.bold, letterSpacing: 2, marginBottom: SPACING.xs },
  activeGym: { color: '#666666', fontSize: FONTS.sizes.md, ...FONTS.regular, marginBottom: SPACING.lg },
  activeTimer: { fontSize: 56, color: '#000000', ...FONTS.bold, letterSpacing: -2 },
  activeTimerLbl: { color: '#666666', fontSize: FONTS.sizes.sm, ...FONTS.medium, marginBottom: SPACING.lg },
  activeNote: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, ...FONTS.regular, textAlign: 'center', paddingHorizontal: SPACING.xl },

  permBox: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  permIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,122,0,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)' },
  permTitle: { fontSize: FONTS.sizes.xxl, color: '#000000', ...FONTS.bold, marginBottom: SPACING.sm },
  permSub: { fontSize: FONTS.sizes.md, color: '#666666', textAlign: 'center', lineHeight: 22, ...FONTS.regular, marginBottom: SPACING.xl },
  permBtn: { width: '100%', borderRadius: RADIUS.xl, overflow: 'hidden' },
  permBtnGrad: { padding: 18, borderRadius: RADIUS.xl, alignItems: 'center' },
  permBtnText: { color: '#fff', fontSize: FONTS.sizes.lg, ...FONTS.bold },

  laserLine: {
    position: 'absolute', left: 2, right: 2, height: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4,
  },
  torchBtn: {
    position: 'absolute', bottom: 56, right: 20, width: 44, height: 44,
    borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
});
