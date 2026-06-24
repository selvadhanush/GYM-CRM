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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // OTP State
  const [showOTPField, setShowOTPField] = useState(false);
  const [otp, setOtp] = useState('');

  const { setUser } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert('Required', 'Please fill in all required fields (Name, Email, Phone, Password)');
      return;
    }

    setLoading(true);
    try {
      await authService.register(name.trim(), email.trim(), password, phone.trim());
      setShowOTPField(true); // Silently move to OTP screen
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      Alert.alert('Registration Failed', message);
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
      await setUser(user); // Logs the user in and redirects
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Verification failed';
      Alert.alert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1080&auto=format&fit=crop' }}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)', '#000000']}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
              
              <View style={styles.content}>
                {/* Header Section */}
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerContainer}>
                  <Text style={styles.title}>Create Account</Text>
                  <Text style={styles.subtitle}>
                    {!showOTPField ? 'Join FitPrime and start your journey today.' : 'Enter the code we sent to your email.'}
                  </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                  {!showOTPField ? (
                    <>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color="#rgba(255,255,255,0.6)" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Full Name *"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={name}
                          onChangeText={setName}
                        />
                      </View>

                      <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#rgba(255,255,255,0.6)" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Email address *"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>

                      <View style={styles.inputWrapper}>
                        <Ionicons name="call-outline" size={20} color="#rgba(255,255,255,0.6)" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Phone Number *"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                        />
                      </View>

                      <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#rgba(255,255,255,0.6)" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Password *"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeButton}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color="rgba(255,255,255,0.6)"
                          />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
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
                  )}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={showOTPField ? handleVerifyOTP : handleRegister}
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
                        <Text style={styles.primaryButtonText}>
                          {showOTPField ? 'Verify & Register' : 'Register Now'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                      <Text style={styles.loginLink}>Log In</Text>
                    </TouchableOpacity>
                  </View>
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
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: 80, // For back button
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },
  headerContainer: {
    marginBottom: 40,
    marginTop: 20,
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
  eyeButton: {
    padding: 8,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    ...FONTS.bold,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    ...FONTS.medium,
  },
  loginLink: {
    color: '#FF7A00',
    fontSize: 15,
    ...FONTS.bold,
  },
});
