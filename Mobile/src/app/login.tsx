import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth';
import { FONTS } from '@/theme';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const [showOTPField, setShowOTPField] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleContinue = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.checkUser(email.trim());
      console.log('CheckUser Response:', response);
      
      if (response.status === 'new') {
        router.push({
          pathname: '/register',
          params: { email: email.trim() }
        });
      } else if (response.role === 'superadmin' || response.role === 'partner' || response.role === 'admin') {
        setShowOTPField(false);
        setShowPasswordField(true);
      } else {
        setShowPasswordField(false);
        setShowOTPField(true);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Verification failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(email.trim(), password);
      await setUser(user);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Required', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.verifyOTP(email.trim(), otp.trim());
      const validRoles = ['member', 'superadmin', 'partner', 'admin'];
      if (!validRoles.includes(user.role)) {
        Alert.alert('Access Denied', 'This app is only for registered users');
        setLoading(false);
        return;
      }
      await setUser(user);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1080&auto=format&fit=crop' }}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#000000']}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior='padding'
            keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
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
                  <Ionicons name="barbell" size={32} color="#FF7A00" />
                </View>
                <Text style={styles.title}>FitPrime</Text>
                <Text style={styles.subtitle}>
                  {!showOTPField && !showPasswordField 
                    ? 'Enter your email to join or sign in.' 
                    : showOTPField 
                      ? 'Check your inbox for the OTP.' 
                      : 'Enter your password to continue.'}
                </Text>
              </View>

              {/* Input Section */}
              <View style={styles.formContainer}>
                {!showOTPField && !showPasswordField ? (
                  <>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#rgba(255,255,255,0.6)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleContinue}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#FF7A00', '#E65C00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <Text style={styles.dividerText}>or continue with</Text>
                      <View style={styles.divider} />
                    </View>

                    <View style={styles.socialContainer}>
                      <TouchableOpacity style={styles.socialButton}>
                        <Ionicons name="logo-google" size={22} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.socialButton}>
                        <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : showOTPField ? (
                  <>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="keypad-outline" size={20} color="#rgba(255,255,255,0.6)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter 6-digit OTP"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleVerifyOTP}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#FF7A00', '#E65C00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Verify & Login</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.backLink}
                      onPress={() => setShowOTPField(false)}
                    >
                      <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.backLinkText}>Use a different email</Text>
                    </TouchableOpacity>
                  </>
                ) : showPasswordField ? (
                  <>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#rgba(255,255,255,0.6)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handlePasswordLogin}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#FF7A00', '#E65C00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Login</Text>
                            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.backLink}
                      onPress={() => setShowPasswordField(false)}
                    >
                      <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.backLinkText}>Use a different email</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
    paddingTop: 40,
  },
  headerContainer: {
    marginBottom: 40,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.3)',
  },
  title: {
    fontSize: 42,
    color: '#FFFFFF',
    ...FONTS.bold,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    ...FONTS.medium,
    lineHeight: 24,
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    height: 64,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    ...FONTS.medium,
  },
  primaryButton: {
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    ...FONTS.bold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    ...FONTS.medium,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 10,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    ...FONTS.medium,
  },
});
