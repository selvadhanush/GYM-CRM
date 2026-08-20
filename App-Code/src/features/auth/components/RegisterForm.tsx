import React, { useState } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { API_CLIENT } from '@/lib/api-client';
import { theme } from '@/design-system/theme';
import { fontFamilies } from '@/design-system/tokens';

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'otp', string>>;

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams();
  const emailParam = (params.email as string) || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(emailParam);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const setFieldValue = (field: keyof FieldErrors, value: string, setter: (v: string) => void) => {
    setter(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleRegister = async () => {
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = 'Enter your name';
    if (!email.trim()) nextErrors.email = 'Enter your email';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) nextErrors.email = 'Enter a valid email address';
    if (!phone.trim() || phone.trim().length < 10) nextErrors.phone = 'Enter a valid 10-digit phone number';
    if (!password.trim() || password.length < 6) nextErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await API_CLIENT.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password
      });

      toast.show('Registration initialised! Verification OTP sent to your email.', 'success');
      setShowOTPVerification(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrors((prev) => ({ ...prev, otp: 'Enter the 6-digit verification code' }));
      return;
    }
    setErrors((prev) => ({ ...prev, otp: undefined }));

    setLoading(true);
    try {
      const { verifyOTP } = useAuth.getState();
      const result = await verifyOTP(email.trim().toLowerCase(), otp.trim());
      if (result.success) {
        toast.show('Account verified! Welcome to FitPass!', 'success');
      } else {
        setErrors((prev) => ({ ...prev, otp: result.message || 'Verification failed' }));
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'OTP verification failed';
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (opts: {
    field: keyof FieldErrors;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    placeholder: string;
    value: string;
    onChangeText: (v: string) => void;
    keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
    maxLength?: number;
    secure?: boolean;
    editable?: boolean;
    autoFocus?: boolean;
  }) => {
    const error = errors[opts.field];
    return (
      <View>
        <View style={[
          styles.inputWrapper,
          { backgroundColor: theme.colors.bgTertiary, borderColor: error ? theme.colors.error : theme.colors.border },
        ]}>
          <Ionicons name={opts.icon} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={opts.placeholder}
            placeholderTextColor={theme.colors.textMuted}
            value={opts.value}
            onChangeText={(t) => setFieldValue(opts.field, t, opts.onChangeText)}
            keyboardType={opts.keyboardType}
            maxLength={opts.maxLength}
            secureTextEntry={opts.secure && !showPassword}
            autoCapitalize={opts.keyboardType === 'email-address' ? 'none' : undefined}
            autoCorrect={opts.keyboardType === 'email-address' ? false : undefined}
            editable={opts.editable}
            autoFocus={opts.autoFocus}
          />
          {opts.secure && (
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              hitSlop={8}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {error ? <Text style={[styles.fieldError, { color: theme.colors.error }]}>{error}</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: theme.colors.bgTertiary, borderColor: theme.colors.border }]}
              onPress={() => {
                if (showOTPVerification) {
                  setShowOTPVerification(false);
                } else {
                  router.replace('/(auth)/login');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{showOTPVerification ? 'VERIFY OTP' : 'FITPASS SIGNUP'}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {showOTPVerification
                  ? `Enter the 6-digit verification code sent to ${email}`
                  : 'Join Zippy FitPass and get access to premier gyms.'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {!showOTPVerification ? (
                <>
                  {renderInput({ field: 'name', icon: 'person-outline', placeholder: 'Full Name', value: name, onChangeText: setName })}
                  {renderInput({
                    field: 'email',
                    icon: 'mail-outline',
                    placeholder: 'Email Address',
                    value: email,
                    onChangeText: setEmail,
                    keyboardType: 'email-address',
                    editable: !emailParam,
                  })}
                  {renderInput({
                    field: 'phone',
                    icon: 'call-outline',
                    placeholder: 'Phone Number (10 Digits)',
                    value: phone,
                    onChangeText: setPhone,
                    keyboardType: 'phone-pad',
                    maxLength: 10,
                  })}
                  {renderInput({
                    field: 'password',
                    icon: 'lock-closed-outline',
                    placeholder: 'Create Password (min. 6 chars)',
                    value: password,
                    onChangeText: setPassword,
                    secure: true,
                  })}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Register account"
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>Register Account</Text>
                          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {renderInput({
                    field: 'otp',
                    icon: 'keypad-outline',
                    placeholder: 'Enter 6-digit Code',
                    value: otp,
                    onChangeText: setOtp,
                    keyboardType: 'number-pad',
                    maxLength: 6,
                    autoFocus: true,
                  })}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Verify and sign in"
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.accent]}
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
  backBtn: {
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 60,
  },
  title: {
    fontFamily: fontFamilies.header,
    fontSize: 28,
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
});
