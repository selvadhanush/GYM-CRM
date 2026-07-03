import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { LayoutDashboard, Building2, History, User, LogOut } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { useAuth } from '@/features/auth';

export default function FitPassLayout() {
  const logout = useAuth((s) => s.logout);

  return (
    <Tabs
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: theme.colors.text,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.info,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerRight: () => (
          <TouchableOpacity
            onPress={logout}
            style={styles.headerBtn}
            activeOpacity={0.7}
            accessibilityLabel="Logout"
          >
            <LogOut color={theme.colors.error} size={18} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'FitPass',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="gyms"
        options={{
          title: 'Partner Gyms',
          tabBarLabel: 'Gyms',
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Check-in History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      {/* QR scanner — hidden tab, accessed via button press */}
      <Tabs.Screen
        name="scan"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabBar: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
});
