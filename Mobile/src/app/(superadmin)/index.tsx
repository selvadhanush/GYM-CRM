import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/theme';
import { useAuthStore } from '@/stores/auth';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome, Master Admin</Text>
            <Text style={styles.subtitle}>{user?.name || 'Super Admin'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}
            onPress={() => router.push('/(superadmin)/gyms')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
              <Ionicons name="business" size={32} color="#3498db" />
            </View>
            <Text style={styles.statTitle}>Partner Gyms</Text>
            <Text style={styles.statSubtitle}>Manage Gyms</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}
            onPress={() => router.push('/(superadmin)/plans')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]}>
              <Ionicons name="star" size={32} color="#2ecc71" />
            </View>
            <Text style={styles.statTitle}>Fit-Prime Plans</Text>
            <Text style={styles.statSubtitle}>Global Hourly Plans</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    ...FONTS.semibold,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...FONTS.regular,
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 12,
  },
  statsContainer: {
    gap: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statTitle: {
    ...FONTS.bold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  statSubtitle: {
    ...FONTS.medium,
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
