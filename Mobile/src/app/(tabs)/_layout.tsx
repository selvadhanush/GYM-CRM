import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '@/theme';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '@/stores/auth';

const CustomHomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg viewBox="0 0 116.4 125.9" width={size} height={size}>
    <Path fill={color} d="m106 36.5-38.4-28.2c-2.7-1.9-5.4-3.2-9.4-3.3s-6.8 1-9.1 2.6l-38.6 28c-1.5 1.2-2.7 1.9-4 3.2l1.7-0.8c-1.7 2.4-3 4.4-3.6 8.5l-0.1 2.5v55.8c0.2 7.8 3.2 11.6 7 14.4s7.5 3.1 11 3.2h17.9-2.4v-20.4c0-11.4 7.9-21 20.3-21.2 8.6 0 19.9 6.2 19.9 21.2v18.4h17.8c3-0.1 5.5-0.4 8.6-2.1 3.8-2.3 7.4-7.3 7.4-13.3v-56.8l-0.3-2.4c-0.7-4-3.4-7.3-5.7-9.3z" />
    <Path fill={color} d="m58.2 90.7c-5.6 0-10.8 4.3-10.8 10.8v19.1h21.7v-19.1c-0.1-6.5-4.8-10.8-10.9-10.8z" />
  </Svg>
);

const CustomPlansIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg viewBox="18 79.5 64 64" width={size} height={size}>
    <Path fill={color} d="m49 90.6c0 1.2 0.5 2.5 1.4 3.4l17.1 17.6c0.9 0.9 2.1 1.5 3.4 1.5s2.6-0.5 3.5-1.4l4-4c0.9-0.9 1.4-2.1 1.4-3.4 0-1.2-0.5-2.4-1.4-3.2l-17.8-18c-0.9-0.8-2-1.4-3.2-1.4h-0.2c-1.1 0-2.1 0.4-3 1.2l-4.2 4.1c-0.7 0.7-1.1 1.6-1.3 2.5v0.5l0.3 0.6z"/>
    <Path fill={color} d="m65.6 83.8 12.2 12.2c0.4 0.4 1.2 0.3 1.4-0.2 1.1-1.7 1-4-0.6-5.5l-7.1-7.4c-1.6-1.5-3.9-1.7-5.7-0.6-0.5 0.4-0.6 1-0.2 1.5z"/>
    <Path fill={color} d="m32.5 111.3c-0.9-0.9-2.1-1.4-3.3-1.4h-0.8c-1 0.2-1.9 0.5-2.7 1.2l-4.3 4.3c-1.4 1.2-1.8 3.2-1.1 4.9 0.2 0.5 0.5 1 0.9 1.4l18 18c0.8 0.8 2 1.4 3.2 1.4h0.3c1.2 0 2.3-0.5 3.1-1.2l4-3.9c1.1-1 1.7-2.3 1.6-3.6-0.1-1.1-0.6-2-1.3-2.7l-17.6-18.4z"/>
    <Path fill={color} d="m22.1 127.1c-0.5-0.4-1.1-0.4-1.5 0.1-1.2 1.6-1 4.1 0.6 5.7l7 6.9c1.4 1.4 3.8 1.7 5.9 0.7 0.6-0.3 0.9-1.1 0.3-1.7l-12.3-11.7z"/>
    <Path fill={color} d="m46.8 120.9c0.7 0.7 1.9 0.8 2.6 0.1l10.1-10c0.8-0.8 0.8-2 0-2.7l-6.4-6.7c-0.7-0.7-1.8-0.7-2.6 0l-10.1 10.1c-0.8 0.8-0.9 2 0 2.9l6.4 6.3z"/>
  </Svg>
);

const CustomQrIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg viewBox="19 47.8 655 587" width={size} height={size}>
    <Path fill={color} d="m97 240c14.7 0 24-10.7 24-23v-61c0-18.6 16.4-36 35-36h62c16.3 1.2 30-8.8 30-25s-10.7-25-26-25h-64c-43.4 0-80 36.6-84 76v71c-1 10.5 11.5 23 23 23z"/>
    <Path fill={color} d="m469 120h65c18.6 0 34 15.4 34 34v61c0 12.9 8.9 25 26 24s26-7.6 26-24v-59c0-43.3-32.7-86-86-86h-66c-11.9 0-23 8.9-23 23s10.6 27 24 27z"/>
    <Path fill={color} d="m222 562h-64c-18.6 0-34-15.4-34-34l-0.1-63c0-11.3-8.3-26.3-25.9-26s-26 12.2-26 24 0 36.6 0 64 17.4 87 89 87 58.9 0 61 0c13.6 0 26-8.3 26-23s-11.2-29-26-29zm373-124.2c-14-1.3-25 10.3-26 20.2v70c0 18.6-15.4 34-34 34h-66c-13.4 0-24 9.3-24 23s7.7 29 24 29 43.9 0 63 0c54.1 0 86-36.3 88-79v-72c0.6-10.4-10-23.8-25-25.2z"/>
    <Path fill={color} d="m526 298"/>
    <Path fill={color} d="m626 316h-94v-100c0-31.4-22.6-59-57-59h-253c-31.4 0-62.1 23-62.1 59v108h-95.9c-8 0-22 6-22 22s8.5 24 23 24h561c12.3 0 22-10.2 22-23s-9.9-31-22-31z"/>
    <Path fill={color} d="m159.9 406 0.1 58c0 31.4 22.6 62 62 62l246-0.1c33.4 0 63.8-22.5 63.8-61.9l0.2-58"/>
  </Svg>
);

const CustomHistoryIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg viewBox="0 0 85.6 91" width={size} height={size}>
    <Path fill={color} d="m41.5 70.5c0-11.2 8.7-23.6 23.9-23.6 4.2 0 8.2 1.1 12.5 3.7v-5.6c0-7-0.1-14.1-0.7-20.9v-1.8c-0.2-2.2-0.9-4.5-1.8-6.7-2.4-5.4-7.3-9.6-13-11l-1.1-0.3s-3.6-0.4-6.6-0.7c-2.2-0.4-6.7-0.6-12.3-0.6s-10.2 0.1-13.9 0.3c-3.2 0.3-7.3 0.7-7.9 0.7-1.2 0.2-2.6 0.4-3.5 0.8h-0.5c-5.5 2-10.5 6.9-12.4 12.9l-0.6 2.2c0 0.7-0.3 2.6-0.4 4.4l-0.3 4.8c-0.2 4.4-0.4 9.6-0.4 16.9s0.2 12.5 0.5 16.4c0.2 2.3 0.4 5.1 0.7 7.1 1.2 6.6 6.4 14.9 16.7 16.5l4.3 0.5c3.2 0.5 8 0.6 14.3 0.6h4l5.5-0.1c-4.4-3.9-7-10.1-7-15v-1.5zm1.3-20.5h-20.6c-3.6 0.2-4.8-3-4.3-4.9 0.4-1.5 1.8-3 3.9-3h21.1c2 0 3.7 1.6 3.7 4-0.1 2.1-1.7 3.8-3.8 3.8v0.1zm15.8-17.2h-37.1c-2 0-3.9-1.8-3.9-4 0-2.1 1.8-4 4.1-4h36.7c2.2-0.2 4.1 1.4 4.1 3.8 0 2-1.5 4-3.8 4l-0.1 0.2z"/>
    <Path fill={color} d="m65.3 52.4c-8.6 0-17.1 6.6-18.3 15.9v2.1c0.3 9.7 7.4 17.7 17.3 17.7h1.7c9-0.2 17.2-6.3 17.3-17.2 0-8.9-6.8-18.3-17.9-18.5h-0.1zm7.4 20.6h-8.1c-0.8 0-2-0.9-2-2.1v-11.9c0-1 1-2 2-2 1.3-0.1 2.3 0.9 2.3 2v9.9h5.8c1.9 0.1 2.7 3.5 0 4.1z"/>
  </Svg>
);

const CustomProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg viewBox="0 0 144.9 171" width={size} height={size}>
    <Path fill={color} d="m71 5.3c18.6-0.2 28.2 9.8 33.9 18.7 3.4 5.9 4.9 10.6 5.1 19 0.1 18.2-12.3 34.9-31.1 39-5 0.9-8.8 1-13.7 0.3-15.2-2-30.5-14.2-32.4-34.4-0.7-12.9 2.9-21.5 9.7-28.9 5-5.6 11.4-10.1 18.4-12.3 2.9-0.9 6.9-1.3 10.1-1.4zm68.7 132.7c-0.1 12.4-5.8 22.9-19.3 26.5-3.7 1.1-8.6 1.4-14.8 1.4h-70.9c-16.4 0.3-29.3-7.7-29.6-26.8v-2.5c0.4-13.6 2.8-27.1 7.8-36.3 5-9.1 12.6-16.6 26.9-17.3 3.1-0.2 5.5 1.5 9.9 4.3l6.3 3.7c2.9 1.3 6.7 2.6 8.7 3.1 5.6 1.2 9.6 1.5 15.7 0.2l7.3-2.4c4.3-2 10.9-6.9 13.7-8.2 1.7-0.8 2.5-0.8 3.6-0.8 6.6 0 17.3 2 23.5 11.1 4.2 5.6 11.1 16.5 11.2 44z"/>
  </Svg>
);

export default function TabLayout() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    // Guard: only 'member' role can access the (tabs) area
    if (!isAuthenticated) {
      router.replace('/login' as any);
      return;
    }
    if (user?.role === 'superadmin') {
      router.replace('/(superadmin)' as any);
    } else if (user?.role === 'admin' || user?.role === 'partner') {
      router.replace('/(admin)' as any);
    }
  }, [isAuthenticated, user]);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => {
          const iconColor = focused ? COLORS.primary : COLORS.textMuted;

          if (route.name === 'scanner') {
            return (
              <View style={styles.centerWrap}>
                <View style={[styles.centerBtn, focused && styles.centerBtnActive]}>
                  <CustomQrIcon size={28} color="#fff" />
                </View>
              </View>
            );
          }

          return (
            <View style={styles.iconWrap}>
              <View style={[styles.iconBg, focused && styles.iconBgActive]}>
                {route.name === 'index' && <CustomHomeIcon size={22} color={iconColor} />}
                {route.name === 'packages' && <CustomPlansIcon size={22} color={iconColor} />}
                {route.name === 'history' && <CustomHistoryIcon size={22} color={iconColor} />}
                {route.name === 'profile' && <CustomProfileIcon size={22} color={iconColor} />}
              </View>
              {focused && <View style={styles.dot} />}
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="packages" options={{ title: 'Plans' }} />
      <Tabs.Screen name="scanner" options={{ title: 'Scan' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="classes" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="gym-details" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    elevation: 0,
    position: 'absolute',
  },
  iconWrap: {
    alignItems: 'center', justifyContent: 'center', height: 50,
  },
  iconBg: {
    width: 44, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBgActive: {
    backgroundColor: 'rgba(255,122,0,0.12)',
  },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary, marginTop: 3,
  },
  centerWrap: {
    top: -18, justifyContent: 'center', alignItems: 'center',
  },
  centerBtn: {
    width: 58, height: 58, borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  centerBtnActive: {
    backgroundColor: COLORS.primaryDark,
  },
});
