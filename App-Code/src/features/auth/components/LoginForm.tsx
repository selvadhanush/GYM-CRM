import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/design-system/theme';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Input, Button, Card, Typography } from '@/components/ui';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const login = useAuth((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    // Basic validation
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success) {
      toast.show('Welcome back to Gym CRM Pro!', 'success');
      // Redirect to superadmin dashboard
      router.replace('/(superadmin)/dashboard');
    } else {
      toast.show(result.message || 'Authentication failed', 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <View style={styles.container}>
        {/* Neon blur blobs */}
        <View style={styles.topBlob} />
        <View style={styles.bottomBlob} />

        <View style={styles.inner}>
          <Card style={styles.loginCard}>
            <View style={styles.logoSection}>
              <View style={styles.logoBadge}>
                <Typography style={styles.logoText}>G</Typography>
              </View>
              <Typography variant="h2" style={styles.appName}>GYM CRM PRO</Typography>
              <Typography variant="caption" color="secondary" style={styles.tagline}>
                The ultimate fitness management experience.
              </Typography>
            </View>

            <View style={styles.form}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                placeholder="name@gym.com"
                keyboardType="email-address"
                autoComplete="email"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
              />

              <Button
                title="Sign In to Dashboard"
                loading={loading}
                onPress={handleLogin}
                style={styles.submitBtn}
              />
            </View>

            <View style={styles.footer}>
              <Typography variant="caption" color="muted" style={styles.footerText}>
                Super Admin Console Mode
              </Typography>
            </View>
          </Card>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    position: 'relative',
    backgroundColor: theme.colors.background,
  },
  topBlob: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: theme.colors.primary,
    opacity: 0.15,
  },
  bottomBlob: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: theme.colors.accent,
    opacity: 0.15,
  },
  inner: {
    width: '100%',
    maxWidth: 400,
    zIndex: 10,
  },
  loginCard: {
    backgroundColor: 'rgba(22, 25, 29, 0.75)', // Glass effect overlay color
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ rotate: '-5deg' }],
    marginBottom: theme.spacing.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0b0d0f',
  },
  appName: {
    ...theme.typography.h2,
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  tagline: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: theme.spacing.md,
    backgroundColor: '#FFFFFF', // High-contrast login submit button matching web design
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
