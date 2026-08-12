import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LayoutDashboard, Building2, Award, User } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { CustomTabBar } from '@/components/layout/CustomTabBar';

export default function FitPassLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} portalType="fitpass" />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'FitPass',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <LayoutDashboard color={color} size={20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gyms"
        options={{
          title: 'Partner Gyms',
          tabBarLabel: 'Gyms',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Building2 color={color} size={20} />
            </View>
          ),
        }}
      />
      {/* Hidden routes — accessible via deep link or the scanner button */}
      <Tabs.Screen name="scan"    options={{ href: null }} />
      <Tabs.Screen name="workouts" options={{ href: null }} />
      <Tabs.Screen name="history"  options={{ href: null }} />
      <Tabs.Screen name="diets"    options={{ href: null }} />
      <Tabs.Screen name="gym/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  iconWrap: {
    width: 36,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(240, 160, 32, 0.14)',
  },
});
