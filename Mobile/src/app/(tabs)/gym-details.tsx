import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, StatusBar, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { memberService } from '@/services/member';
import { COLORS, SPACING, RADIUS, FONTS } from '@/theme';
import { Skeleton } from '@/components/Skeleton';

const { width, height } = Dimensions.get('window');

// Premium Palette for this screen
const PREMIUM = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  accent: COLORS.primary, // App primary color (Orange)
  accentGlow: 'rgba(255, 122, 0, 0.15)', // Orange glow
  border: '#F1F5F9',
  glassDark: 'rgba(0,0,0,0.3)',
};

export default function GymDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const gyms = await memberService.getPartnerGyms();
        const found = gyms.find((g: any) => (g._id || g.id) === id);
        setGym(found);

        // Try to calculate distance if we have the address
        if (found?.address) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const userLoc = await Location.getCurrentPositionAsync({});
            const gymGeocode = await Location.geocodeAsync(found.address);
            if (gymGeocode.length > 0) {
              const gymLoc = gymGeocode[0];
              // Haversine formula
              const R = 6371; // km
              const dLat = (gymLoc.latitude - userLoc.coords.latitude) * Math.PI / 180;
              const dLon = (gymLoc.longitude - userLoc.coords.longitude) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userLoc.coords.latitude * Math.PI / 180) * Math.cos(gymLoc.latitude * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const d = R * c;
              setDistance(d.toFixed(1) + ' km');
            }
          }
        }
      } catch (error) {
        console.error('Failed to init gym details', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) init();
  }, [id]);

  const handleOpenMaps = () => {
    if (gym?.address) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const url = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(gym.address)}`,
        android: `geo:0,0?q=${encodeURIComponent(gym.address)}`,
      });
      if (url) Linking.openURL(url);
    }
  };

  const handleCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/(tabs)/scanner');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Skeleton height={height * 0.5} borderRadius={0} />
        <View style={styles.contentSheet}>
          <Skeleton width={150} height={32} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={80} borderRadius={16} />
        </View>
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={PREMIUM.textSub} />
        <Text style={styles.errorText}>Gym not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Immersive Edge-to-Edge Image Carousel */}
        <View style={styles.heroContainer}>
          {gym.images && gym.images.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {gym.images.map((img: string, i: number) => (
                <View key={i} style={styles.heroImageWrapper}>
                  <Image source={{ uri: img }} style={styles.heroImage} resizeMode="cover" />
                  <LinearGradient 
                    colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']} 
                    style={styles.heroGradient} 
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroImageWrapper, { backgroundColor: '#1E293B' }]}>
              <Ionicons name="barbell" size={80} color="rgba(255,255,255,0.1)" />
              <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.heroGradient} />
            </View>
          )}

          {/* Floating Header Actions */}
          <View style={[styles.headerActions, { top: Math.max(insets.top, 20) }]}>
            <TouchableOpacity style={styles.glassBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            {gym.images && gym.images.length > 1 && (
              <View style={styles.imageCounter}>
                <Ionicons name="images-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.imageCounterText}>{gym.images.length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Premium Floating Content Sheet */}
        <View style={styles.contentSheet}>
          <View style={styles.dragHandle} />
          
          <View style={styles.titleRow}>
            <Text style={styles.gymName}>{gym.name}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Partner</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.infoGrid}>
            <TouchableOpacity style={styles.infoCard} activeOpacity={0.7} onPress={handleOpenMaps}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="location" size={22} color={PREMIUM.accent} />
              </View>
              <View style={styles.infoTextGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.infoLabel}>Location</Text>
                  {distance && (
                    <Text style={styles.distanceBadge}>📍 {distance} away</Text>
                  )}
                </View>
                <Text style={styles.infoValue} numberOfLines={2}>{gym.address || 'Address unavailable'}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="people" size={22} color={PREMIUM.accent} />
              </View>
              <View style={styles.infoTextGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.infoLabel}>Live Occupancy</Text>
                  <View style={[
                    styles.occupancyBadge,
                    {
                      backgroundColor: 
                        (gym.activeSessions || 0) <= 5 ? 'rgba(34,197,94,0.1)' :
                        (gym.activeSessions || 0) <= 15 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
                    }
                  ]}>
                    <View style={[
                      styles.occupancyDot,
                      {
                        backgroundColor: 
                          (gym.activeSessions || 0) <= 5 ? '#22C55E' :
                          (gym.activeSessions || 0) <= 15 ? '#F59E0B' : '#EF4444'
                      }
                    ]} />
                    <Text style={[
                      styles.occupancyBadgeText,
                      {
                        color: 
                          (gym.activeSessions || 0) <= 5 ? '#22C55E' :
                          (gym.activeSessions || 0) <= 15 ? '#F59E0B' : '#EF4444'
                      }
                    ]}>
                      {(gym.activeSessions || 0) <= 5 ? 'Quiet' :
                       (gym.activeSessions || 0) <= 15 ? 'Moderate' : 'Busy'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.infoValue}>
                  {(gym.activeSessions || 0)} active members working out right now
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="call" size={22} color={PREMIUM.accent} />
              </View>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{gym.phone || 'Phone unavailable'}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="mail" size={22} color={PREMIUM.accent} />
              </View>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{gym.email || 'Email unavailable'}</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Floating Action Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <LinearGradient
          colors={['rgba(250,250,250,0)', 'rgba(250,250,250,0.9)', '#FAFAFA']}
          style={styles.footerGradient}
        />
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={handleCheckIn}>
          <Ionicons name="qr-code-outline" size={22} color="#FFF" />
          <Text style={styles.primaryBtnText}>Check In Here</Text>
          <View style={styles.primaryBtnArrow}>
            <Ionicons name="chevron-forward" size={16} color={PREMIUM.accent} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PREMIUM.bg },
  loaderContainer: { flex: 1, backgroundColor: PREMIUM.bg, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: FONTS.sizes.md, color: PREMIUM.textSub, marginTop: SPACING.md, ...FONTS.medium },
  backBtn: { marginTop: SPACING.lg, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: PREMIUM.accentGlow, borderRadius: RADIUS.full },
  backBtnText: { color: PREMIUM.accent, ...FONTS.bold, fontSize: FONTS.sizes.sm },

  heroContainer: { width: width, height: height * 0.5 },
  heroImageWrapper: { width: width, height: '100%', justifyContent: 'center', alignItems: 'center' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  headerActions: {
    position: 'absolute', left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 10,
  },
  glassBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: PREMIUM.glassDark,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  imageCounter: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PREMIUM.glassDark,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  imageCounterText: { color: '#FFF', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  contentSheet: {
    backgroundColor: PREMIUM.surface,
    marginTop: -40,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: SPACING.xl,
    minHeight: height * 0.6,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15,
  },
  dragHandle: {
    width: 40, height: 4, backgroundColor: '#E2E8F0',
    borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.lg,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  gymName: { flex: 1, fontSize: 28, color: PREMIUM.textMain, ...FONTS.bold, letterSpacing: -0.5, lineHeight: 34, marginRight: SPACING.sm },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, marginTop: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  statusText: { color: '#10B981', fontSize: FONTS.sizes.xs, ...FONTS.bold, letterSpacing: 0.5, textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: PREMIUM.border, marginVertical: SPACING.xl },

  sectionTitle: { fontSize: FONTS.sizes.md, color: PREMIUM.textMain, ...FONTS.bold, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.lg },

  infoGrid: { gap: SPACING.md },
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PREMIUM.bg, borderRadius: RADIUS.xl,
    padding: SPACING.md, borderWidth: 1, borderColor: PREMIUM.border,
  },
  infoIconWrap: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoTextGroup: { flex: 1 },
  infoLabel: { fontSize: FONTS.sizes.xs, color: PREMIUM.textSub, ...FONTS.medium, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: FONTS.sizes.sm, color: PREMIUM.textMain, ...FONTS.semibold, lineHeight: 20 },
  distanceBadge: { fontSize: 10, color: PREMIUM.accent, ...FONTS.bold, backgroundColor: PREMIUM.accentGlow, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.xl, paddingTop: 40,
  },
  footerGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PREMIUM.accent, borderRadius: RADIUS.full,
    paddingVertical: 18, paddingHorizontal: SPACING.lg,
    shadowColor: PREMIUM.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  primaryBtnText: { color: '#FFF', fontSize: 17, ...FONTS.bold, marginLeft: 10, flex: 1, textAlign: 'center' },
  primaryBtnArrow: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  occupancyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  occupancyDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  occupancyBadgeText: { fontSize: 10, ...FONTS.bold, textTransform: 'uppercase' },
});
