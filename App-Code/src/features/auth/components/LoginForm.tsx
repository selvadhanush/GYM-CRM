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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { theme } from '@/design-system/theme';

const H4_LOGO = require('../../../../assets/h4.jpeg');
const { width, height } = Dimensions.get('window');

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { login, checkUser, verifyOTP } = useAuth();

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
      console.log('[H4 Portal] CheckUser Response:', response);
      
      if (response.status === 'new') {
        toast.show('New user detected. Redirecting to registration...', 'info');
        router.push({
          pathname: '/register' as any,
          params: { email: trimmedEmail }
        });
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
      const result = await login(email.trim().toLowerCase(), password);
      if (result.success) {
        toast.show('Welcome to H4 Fit Club!', 'success');
      } else {
        toast.show(result.message || 'Login failed', 'error');
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
    if (!otp.trim()) {
      toast.show('Please enter the verification code', 'error');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const result = await verifyOTP(email.trim().toLowerCase(), otp.trim());
      if (result.success) {
        toast.show('Welcome to H4 Fit Club!', 'success');
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
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <View style={styles.logoBadge}>
                <Image source={H4_LOGO} style={styles.logoImage} resizeMode="cover" />
              </View>
              <Text style={styles.title}>H4 PORTAL</Text>
              <Text style={styles.subtitle}>
                {!showOTPField && !showPasswordField 
                  ? 'Sign in to access your H4 Fit Club membership.' 
                  : showOTPField 
                    ? 'Check your email inbox for the H4 verification code.' 
                    : 'Enter your password to access H4 Fit Club.'}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {!showOTPField && !showPasswordField ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#655B50" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#9B9084"
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
                      colors={['#ffe01b', '#f5d400']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#1A1510" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>Continue to H4</Text>
                          <Ionicons name="arrow-forward" size={20} color="#1A1510" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or sign in with</Text>
                    <View style={styles.divider} />
                  </View>

                  <View style={styles.socialContainer}>
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => toast.show('Google Sign-In coming soon to H4 Portal', 'info')}
                    >
                      <Ionicons name="logo-google" size={20} color="#1A1510" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => toast.show('Apple Sign-In coming soon to H4 Portal', 'info')}
                    >
                      <Ionicons name="logo-apple" size={20} color="#1A1510" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : showOTPField ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="keypad-outline" size={20} color="#655B50" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit Code"
                      placeholderTextColor="#9B9084"
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
                      colors={['#ffe01b', '#f5d400']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#1A1510" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.backLink}
                    onPress={handleResetFlow}
                  >
                    <Ionicons name="arrow-back" size={16} color="#655B50" />
                    <Text style={styles.backLinkText}>Use a different email</Text>
                  </TouchableOpacity>
                </>
              ) : showPasswordField ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#655B50" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your H4 password"
                      placeholderTextColor="#9B9084"
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
                      colors={['#ffe01b', '#f5d400']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#1A1510" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>Sign In to H4</Text>
                          <Ionicons name="log-in-outline" size={20} color="#1A1510" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.backLink}
                    onPress={handleResetFlow}
                  >
                    <Ionicons name="arrow-back" size={16} color="#655B50" />
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
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffe01b',
    overflow: 'hidden',
    shadowColor: '#ffe01b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  title: {
    fontSize: 32,
    color: '#1A1510',
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#655B50',
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
    backgroundColor: '#F8F6F0',
    borderRadius: 18,
    height: 60,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#EAE7E1',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#1A1510',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#ffe01b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
    color: '#1A1510',
    fontSize: 17,
    fontWeight: '900',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAE7E1',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9B9084',
    fontSize: 13,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#F8F6F0',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE7E1',
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
    color: '#655B50',
    fontSize: 14,
    fontWeight: '600',
  },
});
