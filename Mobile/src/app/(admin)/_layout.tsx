import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/theme';
import { useAuthStore } from '@/stores/auth';

export default function AdminTabLayout() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    // Guard: only admin and partner roles can access this area
    if (!isAuthenticated) {
      router.replace('/login' as any);
      return;
    }
    const isAdminRole = user?.role === 'admin' || user?.role === 'partner';
    if (!isAdminRole) {
      // Wrong role — redirect to correct dashboard
      if (user?.role === 'superadmin') {
        router.replace('/(superadmin)' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    }
  }, [isAuthenticated, user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundCard,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          ...FONTS.medium,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          href: null,
          title: 'Attendance',
        }}
      />
      <Tabs.Screen
        name="equipments"
        options={{
          href: null,
          title: 'Equipments',
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          href: null,
          title: 'Expenses',
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          href: null,
          title: 'Payments',
        }}
      />
      <Tabs.Screen
        name="dues"
        options={{
          href: null,
          title: 'Dues',
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          href: null,
          title: 'Classes',
        }}
      />
      <Tabs.Screen
        name="freeze"
        options={{
          href: null,
          title: 'Freeze Management',
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          href: null,
          title: 'Leads',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
          title: 'Analytics',
        }}
      />
      <Tabs.Screen
        name="branches"
        options={{
          href: null,
          title: 'Branches',
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          href: null,
          title: 'Staff',
        }}
      />
      <Tabs.Screen
        name="body-assessments"
        options={{
          href: null,
          title: 'Body Assessments',
        }}
      />
      <Tabs.Screen
        name="trainer-attendance"
        options={{
          href: null,
          title: 'Trainer Attendance',
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          href: null,
          title: 'Payroll',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null,
          title: 'Reports',
        }}
      />
    </Tabs>
  );
}
