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
  Dimensions,
  ScrollView,
  Image,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const H4_LOGO = require('../../../../assets/h4.jpeg');
const { width, height } = Dimensions.get('window');

type PortalType = 'fitpass' | 'h4' | null;

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { login, checkUser, verifyOTP } = useAuth();

  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showOTPField, setShowOTPField] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  
  const isSubmittingRef = useRef(false);

  const handleContinue = async () => {
    if (isSubmittingRef.current) return;
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      toast.show('Please enter your email address', 'error');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      toast.show('Please enter a valid email address', 'error');
      return;
    }

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
      toast.show('Please enter your password', 'error');
      return;
    }

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
          toast.show(msg || 'Login failed', 'error');
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
      toast.show('Please enter the 6-digit verification code', 'error');
      return;
    }

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
          const wrongPortal = selectedPortal === 'h4' ? 'H4 Portal' : 'Fit-Pass';
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
        toast.show(result.message || 'Verification failed', 'error');
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
  };

  // STEP 1: PORTAL SELECTION PAGE (Highly transparent overlay, background clearly visible)
  if (!selectedPortal) {
    return (
      <View style={styles.portalContainer}>
        <ImageBackground
          source={{ uri: 'https://i.pinimg.com/736x/2e/d2/63/2ed2631a6a862f33a35286cd6b6c41d6.jpg' }}
          style={styles.bgImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.25)']}
            style={styles.overlayGradient}
          >
            <SafeAreaView style={styles.portalSafeArea}>
              <View style={styles.portalHeader}>
                <Text style={styles.portalWelcomeText}>WELCOME</Text>
                <Text style={styles.portalAppTitle}>ZIPPY FIT PRIME</Text>
              </View>

              <View style={styles.portalBottomGroup}>
                <View style={styles.portalCardContainer}>
                  {/* H4 PORTAL BUTTON (FIRST) */}
                  <TouchableOpacity
                    style={styles.portalCard}
                    activeOpacity={0.88}
                    onPress={() => setSelectedPortal('h4')}
                  >
                    <LinearGradient
                      colors={['#E04F00', '#C43600']}
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
                  >
                    <LinearGradient
                      colors={['#FF6B00', '#E04F00']}
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

                <Text style={styles.footerNote}>Zippy Digital Solutions • Engineering Standard v1.1</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  // STEP 2: LOGIN FORM PAGE FOR SELECTED PORTAL (Light Theme, Premium Orange branding)
  const isH4 = selectedPortal === 'h4';
  const portalTitle = isH4 ? 'H4 PORTAL' : 'FIT-PASS';

  return (
    <SafeAreaView style={styles.safeArea}>
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
              style={styles.switchPortalBtn}
              onPress={() => {
                handleResetFlow();
                setSelectedPortal(null);
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#4A3F35" />
            </TouchableOpacity>

            {/* Header Section */}
            <View style={styles.headerContainer}>
              <View style={styles.logoBadge}>
                {isH4 ? (
                  <Image source={H4_LOGO} style={styles.logoImage} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={['#FF6B00', '#E04F00']}
                    style={styles.fitpassBadgeGradient}
                  >
                    <Ionicons name="card-outline" size={40} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </View>
              <Text style={styles.title}>{portalTitle}</Text>
              <Text style={styles.subtitle}>
                {!showOTPField && !showPasswordField 
                  ? `Sign in to access your ${isH4 ? 'H4 Fit Club' : 'FitPass'} account.` 
                  : showOTPField 
                    ? `Check your email inbox for the ${portalTitle} verification code.` 
                    : `Enter your password to access ${portalTitle}.`}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {!showOTPField && !showPasswordField ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#6E5E51" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#A19183"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleContinue}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#FF6B00', '#E04F00']}
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
              ) : showOTPField ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="keypad-outline" size={20} color="#6E5E51" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit Code"
                      placeholderTextColor="#A19183"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#FF6B00', '#E04F00']}
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
                  >
                    <Ionicons name="arrow-back" size={16} color="#6E5E51" />
                    <Text style={styles.backLinkText}>Use a different email</Text>
                  </TouchableOpacity>
                </>
              ) : showPasswordField ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6E5E51" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={`Enter your ${portalTitle} password`}
                      placeholderTextColor="#A19183"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handlePasswordLogin}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#FF6B00', '#E04F00']}
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
                  >
                    <Ionicons name="arrow-back" size={16} color="#6E5E51" />
                    <Text style={styles.backLinkText}>Use a different email</Text>
                  </TouchableOpacity>
                </>
              ) : null}
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
    backgroundColor: '#FAFAFA',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  portalWelcomeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 2,
    marginBottom: 6,
  },
  portalAppTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1C1611',
    letterSpacing: 1,
    marginBottom: 8,
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
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  portalCardGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  portalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portalCardTitle: {
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
  portalCardDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    fontWeight: '500',
  },
  portalCardTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  footerNote: {
    textAlign: 'center',
    color: '#8C7E74',
    fontSize: 12,
    fontWeight: '600',
  },

  // STEP 2: Form styles (Light Theme)
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
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
    backgroundColor: '#F3F0EC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6E1DC',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#F3F0EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B00',
    overflow: 'hidden',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
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
    fontSize: 32,
    color: '#1C1611',
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6E5E51',
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
    backgroundColor: '#F4F1EC',
    borderRadius: 18,
    height: 60,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#E6E1DC',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#1C1611',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
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
  },
  backLinkText: {
    color: '#6E5E51',
    fontSize: 14,
    fontWeight: '600',
  },
});
