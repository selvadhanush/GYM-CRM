import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { theme } from '@/design-system/theme';
import { fontFamilies } from '@/design-system/tokens';

const H4_LOGO = require('../../../../assets/h4.jpeg');

type PortalType = 'fitpass' | 'h4' | null;
type Step = 'email' | 'otp' | 'password';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { login, checkUser, verifyOTP } = useAuth();

  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const [showOTPField, setShowOTPField] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  const isSubmittingRef = useRef(false);

  const step: Step = showOTPField ? 'otp' : showPasswordField ? 'password' : 'email';

  const handleContinue = async () => {
    if (isSubmittingRef.current) return;
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError('Enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setEmailError(null);
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const response = await checkUser(trimmedEmail);

      if (response.status === 'new') {
        if (selectedPortal === 'h4') {
          toast.show('Account not found. Please contact H4 Gym admin to register.', 'error');
        } else {
          toast.show('New user detected. Redirecting to registration...', 'info');
          router.push({
            pathname: '/register' as any,
            params: { email: trimmedEmail, portal: 'fitpass' }
          });
        }
      } else if (['superadmin', 'partner', 'admin', 'trainer', 'receptionist', 'fitpass_admin', 'h4_admin'].includes(response.role || '')) {
        setShowOTPField(false);
        setShowPasswordField(true);
      } else {
        setShowPasswordField(false);
        setShowOTPField(true);
        toast.show('Verification code sent to your email', 'success');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Verification failed';
      toast.show(message, 'error');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handlePasswordLogin = async () => {
    if (isSubmittingRef.current) return;
    if (!password.trim()) {
      setPasswordError('Enter your password');
      return;
    }
    setPasswordError(null);

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const result = await login(email.trim().toLowerCase(), password, selectedPortal || undefined);
      if (result.success) {
        toast.show(`Welcome to ${selectedPortal === 'fitpass' ? 'FitPass' : 'H4 Fit Club'}!`, 'success');
      } else {
        // Friendly portal-mismatch messages
        const msg = result.message || '';
        if (msg.includes('H4 Gym Members')) {
          toast.show('You are an H4 member. Please go back and use the H4 Portal button instead.', 'error');
        } else if (msg.includes('Fitpass Members')) {
          toast.show('You are a Fit-Pass member. Please go back and use the Fit-Pass button instead.', 'error');
        } else {
          setPasswordError(msg || 'Incorrect password');
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.show(message, 'error');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerifyOTP = async () => {
    if (isSubmittingRef.current) return;
    if (!otp.trim() || otp.trim().length !== 6) {
      setOtpError('Enter the 6-digit verification code');
      return;
    }
    setOtpError(null);

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const result = await verifyOTP(email.trim().toLowerCase(), otp.trim());
      if (result.success) {
        // Portal mismatch check: get the division assigned after login
        const assignedDivision = useAuth.getState().activeDivision;
        if (assignedDivision && assignedDivision !== selectedPortal) {
          // Wrong portal — log them out and show a friendly redirect message
          await useAuth.getState().logout();
          const correctPortal = assignedDivision === 'h4' ? 'H4 Portal' : 'Fit-Pass';
          toast.show(
            `You are a ${correctPortal} member. Please log in through the ${correctPortal} button instead.`,
            'error'
          );
          handleResetFlow();
          setSelectedPortal(null);
        } else {
          toast.show(`Welcome to ${selectedPortal === 'fitpass' ? 'FitPass' : 'H4 Fit Club'}!`, 'success');
        }
      } else {
        setOtpError(result.message || 'Verification failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Verification failed';
      toast.show(message, 'error');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleResetFlow = () => {
    setShowOTPField(false);
    setShowPasswordField(false);
    setPassword('');
    setOtp('');
    setEmailError(null);
    setPasswordError(null);
    setOtpError(null);
  };

  // STEP 1: PORTAL SELECTION PAGE
  if (!selectedPortal) {
    return (
      <View style={[styles.portalContainer, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.bgTertiary]}
          style={styles.overlayGradient}
        >
          <SafeAreaView style={styles.portalSafeArea}>
            <View style={styles.portalHeader}>
              <View style={[styles.brandMark, { borderColor: theme.colors.primary }]}>
                <Image source={H4_LOGO} style={styles.brandMarkImage} resizeMode="cover" />
              </View>
              <Text style={[styles.portalWelcomeText, { color: theme.colors.primary }]}>WELCOME</Text>
              <Text style={[styles.portalAppTitle, { color: theme.colors.text }]}>ZIPPY FIT PRIME</Text>
              <Text style={[styles.portalSubtitle, { color: theme.colors.textSecondary }]}>
                Choose the portal you're a member of to continue
              </Text>
            </View>

            <View style={styles.portalBottomGroup}>
              <View style={styles.portalCardContainer}>
                {/* H4 PORTAL BUTTON (FIRST) */}
                <TouchableOpacity
                  style={styles.portalCard}
                  activeOpacity={0.88}
                  onPress={() => setSelectedPortal('h4')}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with H4 Portal"
                >
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.portalCardGradient}
                  >
                    <View style={styles.portalCardContent}>
                      <View style={styles.portalCardIconWrapper}>
                        <Image source={H4_LOGO} style={styles.portalCardLogoIcon} resizeMode="cover" />
                      </View>
                      <Text style={styles.portalCardTitle}>Continue with H4 Portal</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* FITPASS BUTTON (SECOND) */}
                <TouchableOpacity
                  style={styles.portalCard}
                  activeOpacity={0.88}
                  onPress={() => setSelectedPortal('fitpass')}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Fit-Pass"
                >
                  <LinearGradient
                    colors={[theme.colors.fitpassAccent, '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.portalCardGradient}
                  >
                    <View style={styles.portalCardContent}>
                      <Ionicons name="barbell-outline" size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
                      <Text style={styles.portalCardTitle}>Continue with Fit-Pass</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Text style={[styles.footerNote, { color: theme.colors.textMuted }]}>Zippy Digital Solutions • Engineering Standard v1.1</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // STEP 2: LOGIN FORM PAGE FOR SELECTED PORTAL
  const isH4 = selectedPortal === 'h4';
  const portalTitle = isH4 ? 'H4 PORTAL' : 'FIT-PASS';
  const portalAccent = isH4 ? theme.colors.primary : theme.colors.fitpassAccent;
  const stepIndex = step === 'email' ? 0 : 1;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Top Switch Portal Back Navigation */}
            <TouchableOpacity
              style={[styles.switchPortalBtn, { backgroundColor: theme.colors.bgTertiary, borderColor: theme.colors.border }]}
              onPress={() => {
                handleResetFlow();
                setSelectedPortal(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Switch portal"
            >
              <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            {/* Step indicator: Step 1 (email) → Step 2 (otp/password) */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: portalAccent }]} />
              <View style={[styles.stepLine, { backgroundColor: stepIndex >= 1 ? portalAccent : theme.colors.border }]} />
              <View style={[styles.stepDot, { backgroundColor: stepIndex >= 1 ? portalAccent : theme.colors.border }]} />
            </View>

            {/* Header Section */}
            <View style={styles.headerContainer}>
              <View style={[styles.logoBadge, { backgroundColor: theme.colors.bgTertiary, borderColor: portalAccent }]}>
                {isH4 ? (
                  <Image source={H4_LOGO} style={styles.logoImage} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={[theme.colors.fitpassAccent, '#1D4ED8']}
                    style={styles.fitpassBadgeGradient}
                  >
                    <Ionicons name="card-outline" size={40} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>{portalTitle}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {step === 'email'
                  ? `Sign in to access your ${isH4 ? 'H4 Fit Club' : 'FitPass'} account.`
                  : step === 'otp'
                    ? `Check your email inbox for the ${portalTitle} verification code.`
                    : `Enter your password to access ${portalTitle}.`}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {step === 'email' ? (
                <>
                  <View>
                    <View style={[
                      styles.inputWrapper,
                      { backgroundColor: theme.colors.bgTertiary, borderColor: emailError ? theme.colors.error : theme.colors.border },
                    ]}>
                      <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.colors.text }]}
                        placeholder="Email Address"
                        placeholderTextColor={theme.colors.textMuted}
                        value={email}
                        onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(null); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                      />
                    </View>
                    {emailError ? <Text style={[styles.fieldError, { color: theme.colors.error }]}>{emailError}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleContinue}
                    disabled={loading}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={`Continue to ${portalTitle}`}
                  >
                    <LinearGradient
                      colors={[portalAccent, isH4 ? theme.colors.accent : '#1D4ED8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>Continue to {portalTitle}</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : step === 'otp' ? (
                <>
                  <View>
                    <View style={[
                      styles.inputWrapper,
                      { backgroundColor: theme.colors.bgTertiary, borderColor: otpError ? theme.colors.error : theme.colors.border },
                    ]}>
                      <Ionicons name="keypad-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.colors.text }]}
                        placeholder="Enter 6-digit Code"
                        placeholderTextColor={theme.colors.textMuted}
                        value={otp}
                        onChangeText={(t) => { setOtp(t); if (otpError) setOtpError(null); }}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                    </View>
                    {otpError ? <Text style={[styles.fieldError, { color: theme.colors.error }]}>{otpError}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Verify and sign in"
                  >
                    <LinearGradient
                      colors={[portalAccent, isH4 ? theme.colors.accent : '#1D4ED8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backLink}
                    onPress={handleResetFlow}
                    accessibilityRole="button"
                    accessibilityLabel="Use a different email"
                  >
                    <Ionicons name="arrow-back" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.backLinkText, { color: theme.colors.textSecondary }]}>Use a different email</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View>
                    <View style={[
                      styles.inputWrapper,
                      { backgroundColor: theme.colors.bgTertiary, borderColor: passwordError ? theme.colors.error : theme.colors.border },
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.colors.text }]}
                        placeholder={`Enter your ${portalTitle} password`}
                        placeholderTextColor={theme.colors.textMuted}
                        value={password}
                        onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(null); }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        hitSlop={8}
                      >
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    {passwordError ? <Text style={[styles.fieldError, { color: theme.colors.error }]}>{passwordError}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handlePasswordLogin}
                    disabled={loading}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={`Sign in to ${portalTitle}`}
                  >
                    <LinearGradient
                      colors={[portalAccent, isH4 ? theme.colors.accent : '#1D4ED8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>Sign In to {portalTitle}</Text>
                          <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backLink}
                    onPress={handleResetFlow}
                    accessibilityRole="button"
                    accessibilityLabel="Use a different email"
                  >
                    <Ionicons name="arrow-back" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.backLinkText, { color: theme.colors.textSecondary }]}>Use a different email</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // STEP 1: Portal Selection styles
  portalContainer: {
    flex: 1,
  },
  overlayGradient: {
    flex: 1,
  },
  portalSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  portalHeader: {
    alignItems: 'center',
    marginTop: 40,
  },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  brandMarkImage: {
    width: '100%',
    height: '100%',
  },
  portalWelcomeText: {
    fontFamily: fontFamilies.header,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  portalAppTitle: {
    fontFamily: fontFamilies.header,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  portalSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  portalCardContainer: {
    gap: 16,
    marginBottom: 16,
  },
  portalBottomGroup: {
    marginTop: 'auto',
    width: '100%',
  },
  portalCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  portalCardGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  portalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portalCardTitle: {
    fontFamily: fontFamilies.header,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  portalCardIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalCardLogoIcon: {
    width: '100%',
    height: '100%',
  },
  footerNote: {
    fontFamily: fontFamilies.body,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },

  // STEP 2: Form styles
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  content: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  switchPortalBtn: {
    position: 'absolute',
    top: 0,
    left: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { width: 28, height: 2, borderRadius: 1 },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  fitpassBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamilies.header,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  formContainer: {
    gap: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    height: 60,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  fieldError: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  primaryButton: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontFamily: fontFamilies.header,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    minHeight: 44,
  },
  backLinkText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    fontWeight: '600',
  },
});
