import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Activity, QrCode } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card } from '@/components/ui';

export default function LandingScreen() {
  const router = useRouter();

  const handleSelectPortal = (portal: 'staff' | 'h4' | 'fitpass') => {
    router.push(`/login?portal=${portal}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Typography style={styles.logoText}>GP</Typography>
        </View>
        <Typography variant="display" style={styles.title}>
          ZIPPY FITPRIME
        </Typography>
        <Typography variant="bodySm" color="secondary" style={styles.subtitle}>
          Select your portal destination to access your training tools and memberships.
        </Typography>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          onPress={() => handleSelectPortal('staff')}
          activeOpacity={0.8}
          style={styles.cardWrapper}
        >
          <Card accentColor={theme.colors.primary} style={styles.selectionCard}>
            <View style={styles.iconContainer}>
              <ShieldCheck size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Typography variant="h2" style={styles.cardTitle}>
                Staffs & Partners
              </Typography>
              <Typography variant="caption" color="secondary" style={styles.cardDesc}>
                Access the management consoles, partner dashboard, operations, and coaching hubs.
              </Typography>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelectPortal('h4')}
          activeOpacity={0.8}
          style={styles.cardWrapper}
        >
          <Card accentColor={theme.colors.success} style={styles.selectionCard}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(46, 125, 50, 0.1)' }]}>
              <Activity size={28} color={theme.colors.success} />
            </View>
            <View style={styles.cardContent}>
              <Typography variant="h2" style={styles.cardTitle}>
                H4 Fitness Users
              </Typography>
              <Typography variant="caption" color="secondary" style={styles.cardDesc}>
                View branch statistics, schedule sessions, and track physical gym memberships.
              </Typography>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelectPortal('fitpass')}
          activeOpacity={0.8}
          style={styles.cardWrapper}
        >
          <Card accentColor={theme.colors.info} style={styles.selectionCard}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(25, 118, 210, 0.1)' }]}>
              <QrCode size={28} color={theme.colors.info} />
            </View>
            <View style={styles.cardContent}>
              <Typography variant="h2" style={styles.cardTitle}>
                Fitpass Users
              </Typography>
              <Typography variant="caption" color="secondary" style={styles.cardDesc}>
                Scan QR gates at partner gyms, review session counts, and manage universal passes.
              </Typography>
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      <Typography variant="caption" color="muted" style={styles.footerText}>
        Zippy Digital Solutions © 2026
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
    marginBottom: theme.spacing.xl,
    maxWidth: 320,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary,
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
    fontSize: 24,
    fontWeight: '900',
    color: '#231D14',
  },
  title: {
    ...theme.typography.display,
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
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.h3,
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
    color: theme.colors.textMuted,
  },
});
