import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { LayoutDashboard, CreditCard, CalendarCheck, User, LogOut, Dumbbell, Apple } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function H4Layout() {
  const logout = useAuth((s) => s.logout);

  return (
    <Tabs
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: theme.colors.text,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FF5F1F', // Electric Orange
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
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
          title: 'H4 Fitness',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarLabel: 'Workouts',
          tabBarIcon: ({ color }) => <Dumbbell color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="diets"
        options={{
          title: 'Diets & Hydration',
          tabBarLabel: 'Diets',
          tabBarIcon: ({ color }) => <Apple color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color }) => <CalendarCheck color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payment History',
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color }) => <CreditCard color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
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
    height: 64,
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    paddingBottom: 2,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
});
