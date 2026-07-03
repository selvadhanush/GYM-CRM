import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/design-system/theme';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Input, Button, Card, Typography } from '@/components/ui';

export const LoginForm: React.FC<{ portal: 'staff' | 'h4' | 'fitpass' }> = ({ portal }) => {
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

    const result = await login(email.trim().toLowerCase(), password, portal);
    setLoading(false);

    if (result.success) {
      toast.show('Welcome back!', 'success');
      // Redirect to superadmin dashboard
      router.replace('/(superadmin)/dashboard');
    } else {
      toast.show(result.message || 'Authentication failed', 'error');
    }
  };

  // Dynamic content based on portal type
  const portalDetails = {
    staff: {
      badgeText: 'S',
      title: 'STAFF & PARTNERS',
      tagline: 'Access operations, analytics, and management hubs.',
      accent: theme.colors.primary,
      footer: 'Staff Console Mode',
    },
    h4: {
      badgeText: 'H4',
      title: 'H4 FIT CLUB',
      tagline: 'Track physical branches and physical member tools.',
      accent: theme.colors.success,
      footer: 'H4 Fitness Portal',
    },
    fitpass: {
      badgeText: 'FP',
      title: 'FITPASS UNIVERSAL',
      tagline: 'Access universal session passes and check-in portals.',
      accent: theme.colors.info,
      footer: 'FitPass Member Portal',
    },
  }[portal] || {
    badgeText: 'G',
    title: 'GYM CRM PRO',
    tagline: 'The ultimate fitness management experience.',
    accent: theme.colors.primary,
    footer: 'Console Mode',
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
          <Card style={styles.loginCard} accentColor={portalDetails.accent}>
            <View style={styles.logoSection}>
              <View style={[styles.logoBadge, { backgroundColor: portalDetails.accent }]}>
                <Typography style={styles.logoText}>{portalDetails.badgeText}</Typography>
              </View>
              <Typography variant="h2" style={styles.appName}>{portalDetails.title}</Typography>
              <Typography variant="caption" color="secondary" style={styles.tagline}>
                {portalDetails.tagline}
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
                title={`Sign In to ${portalDetails.title}`}
                loading={loading}
                onPress={handleLogin}
                style={styles.submitBtn}
              />
            </View>

            <View style={styles.footer}>
              <Typography variant="caption" color="muted" style={styles.footerText}>
                {portalDetails.footer}
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
