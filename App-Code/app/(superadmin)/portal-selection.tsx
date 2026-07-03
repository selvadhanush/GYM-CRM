import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Globe, Lock } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Typography, Card } from '@/components/ui';

export default function PortalSelectionScreen() {
  const changeActiveDivision = useAuth((state) => state.changeActiveDivision);
  const user = useAuth((state) => state.user);
  const router = useRouter();

  const handleSelect = async (division: 'fitpass' | 'h4') => {
    try {
      await changeActiveDivision(division);
      router.replace('/(superadmin)/dashboard');
    } catch (err) {
      console.error('Failed to change division:', err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      <View style={styles.header}>
        <Shield size={44} color={theme.colors.primary} style={styles.logo} />
        <Typography variant="h1" style={styles.title}>
          ZIPPY PRIME PORTAL
        </Typography>
        <Typography variant="bodySm" color="secondary" style={styles.subtitle}>
          Welcome, {user?.name || 'Super Admin'}. Please choose the administration console you wish to access.
        </Typography>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          onPress={() => handleSelect('fitpass')}
          activeOpacity={0.8}
          style={styles.cardWrapper}
        >
          <Card accentColor={theme.colors.primary} style={styles.selectionCard}>
            <View style={styles.iconContainer}>
              <Globe size={32} color={theme.colors.primary} />
            </View>
            <Typography variant="h2" style={styles.cardTitle}>
              FitPass Portal
            </Typography>
            <Typography variant="caption" color="secondary" style={styles.cardDesc}>
              Manage global partner gyms, subscription plans, platform revenue, and system-wide audit records.
            </Typography>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelect('h4')}
          activeOpacity={0.8}
          style={styles.cardWrapper}
        >
          <Card accentColor={theme.colors.success} style={styles.selectionCard}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 255, 102, 0.1)' }]}>
              <Shield size={32} color={theme.colors.success} />
            </View>
            <Typography variant="h2" style={styles.cardTitle}>
              H4 Gym Portal
            </Typography>
            <Typography variant="caption" color="secondary" style={styles.cardDesc}>
              Access physical H4 branches database, check-ins, local member listings, trainer payroll, and expenses.
            </Typography>
          </Card>
        </TouchableOpacity>
      </View>

      <Typography variant="caption" color="muted" style={styles.footerText}>
        <Lock size={12} color={theme.colors.textMuted} /> Secured Super-Admin Management Access
      </Typography>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    maxWidth: 320,
  },
  logo: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    width: '100%',
    maxWidth: 380,
    gap: theme.spacing.md,
  },
  cardWrapper: {
    width: '100%',
  },
  selectionCard: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bgTertiary,
    minHeight: 140,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.brandMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardDesc: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  footerText: {
    marginTop: theme.spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    color: theme.colors.textMuted,
  },
});
