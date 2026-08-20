import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Flame,
  MapPin,
  Sparkles,
  Zap,
  CalendarPlus,
  Star,
  CircleDot,
  X,
  Phone,
  Navigation,
  Check,
  Dumbbell,
  Images,
} from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { useDiscoveryGyms, usePublicPostsFeed } from '../api/fitpass.api';
import type { DiscoveryGymItem } from '../types';

// Category filter pills — icon + label. Uses the app's lucide-react-native
// set instead of raw emoji glyphs (which render inconsistently across OS/font)
// to match the rest of the app's iconography.
const CATEGORIES = [
  { id: 'all', label: 'All Gyms', Icon: Flame },
  { id: 'nearby', label: 'Nearby', Icon: MapPin },
  { id: 'recommended', label: 'Recommended', Icon: Sparkles },
  { id: 'trending', label: 'Trending', Icon: Zap },
  { id: 'newly_added', label: 'Newly Added', Icon: CalendarPlus },
  { id: 'highest_rated', label: 'Top Rated', Icon: Star },
  { id: 'open_now', label: 'Open Now', Icon: CircleDot },
];

export const GymDiscoveryExplore: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGym, setSelectedGym] = useState<DiscoveryGymItem | null>(null);

  const { data: gyms = [], isLoading: loadingGyms } = useDiscoveryGyms({
    category: activeCategory !== 'all' ? activeCategory : undefined,
    search: searchQuery || undefined,
  });

  const { data: posts = [] } = usePublicPostsFeed();

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (gym: DiscoveryGymItem) => {
    const p = gym.discoveryProfile || {};
    const url = p.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(gym.name + ' ' + (p.address || ''))}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <View style={styles.searchSection}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Search by gym name, city, amenities..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                { backgroundColor: theme.colors.card },
                isSelected && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
            >
              <cat.Icon size={13} color={isSelected ? theme.colors.background : theme.colors.textSecondary} />
              <Text
                style={[
                  styles.categoryChipText,
                  { color: theme.colors.textSecondary },
                  isSelected && { color: theme.colors.background, fontWeight: 'bold' },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Gym Highlights Posts Horizontal Carousel */}
        {posts.length > 0 && (
          <View style={styles.postsSection}>
            <View style={styles.sectionTitleRow}>
              <Images size={16} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Gym Highlights</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {posts.map((post) => (
                <View key={post.id} style={[styles.postCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  {post.images && post.images.length > 0 ? (
                    <Image source={{ uri: post.images[0] }} style={styles.postCardImage} />
                  ) : (
                    <View style={[styles.postCardImage, { backgroundColor: theme.colors.bgTertiary }]} />
                  )}
                  <View style={styles.postCardBody}>
                    <Text style={[styles.postGymName, { color: theme.colors.primary }]}>{post.gym?.name}</Text>
                    <Text style={[styles.postTitle, { color: theme.colors.text }]} numberOfLines={1}>{post.title}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Gym List */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            FitPass Gyms ({gyms.length})
          </Text>

          {loadingGyms ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 30 }} />
          ) : gyms.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No gyms match your search criteria.</Text>
            </View>
          ) : (
            gyms.map((gym) => {
              const p = gym.discoveryProfile || {};
              return (
                <TouchableOpacity
                  key={gym.id}
                  style={[styles.gymCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={() => setSelectedGym(gym)}
                  activeOpacity={0.8}
                >
                  <View style={styles.coverWrapper}>
                    <Image
                      source={{ uri: p.coverImageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' }}
                      style={styles.coverImage}
                    />
                    <Image
                      source={{ uri: p.logoUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=80' }}
                      style={[styles.logoImage, { borderColor: theme.colors.card }]}
                    />
                    <View style={styles.statusPillsRow}>
                      {p.isOpenNow ? (
                        <View style={[styles.statusPill, styles.statusPillRow, { backgroundColor: `${theme.colors.success}E6` }]}>
                          <CircleDot size={10} color="#FFFFFF" />
                          <Text style={styles.statusPillText}>Open Now</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusPill, styles.statusPillRow, { backgroundColor: `${theme.colors.error}E6` }]}>
                          <CircleDot size={10} color="#FFFFFF" />
                          <Text style={styles.statusPillText}>Closed</Text>
                        </View>
                      )}
                      {p.distanceKm !== null && p.distanceKm !== undefined && (
                        <View style={[styles.statusPill, styles.statusPillRow, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                          <MapPin size={10} color={theme.colors.primary} />
                          <Text style={[styles.statusPillText, { color: theme.colors.primary }]}>{p.distanceKm} km</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.gymCardContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.gymTitle, { color: theme.colors.text }]}>{gym.name}</Text>
                      <View style={styles.ratingRow}>
                        <Star size={13} color={theme.colors.primary} fill={theme.colors.primary} />
                        <Text style={[styles.ratingText, { color: theme.colors.primary }]}>{p.rating || 4.8}</Text>
                      </View>
                    </View>
                    <View style={styles.addressRow}>
                      <MapPin size={12} color={theme.colors.textSecondary} />
                      <Text style={[styles.gymAddress, { color: theme.colors.textSecondary }]}>{p.city || 'Chennai'} • {p.address}</Text>
                    </View>
                    <Text style={[styles.gymDesc, { color: theme.colors.textMuted }]} numberOfLines={2}>{p.shortDescription}</Text>

                    <View style={[styles.detailsBtn, { backgroundColor: theme.colors.primary }]}>
                      <Text style={[styles.detailsBtnText, { color: theme.colors.background }]}>View Full Profile & Facilities →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Gym Profile Details Modal */}
      {selectedGym && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedGym(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
              <ScrollView>
                <View style={styles.modalCoverWrapper}>
                  <Image
                    source={{ uri: selectedGym.discoveryProfile?.coverImageUrl }}
                    style={styles.modalCoverImage}
                  />
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedGym(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <X size={18} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.modalHeaderInfo}>
                    <Image
                      source={{ uri: selectedGym.discoveryProfile?.logoUrl }}
                      style={[styles.modalLogo, { borderColor: theme.colors.primary }]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalGymTitle, { color: theme.colors.text }]}>{selectedGym.name}</Text>
                      <View style={styles.ratingRow}>
                        <Text style={[styles.modalGymSub, { color: theme.colors.brandLight }]}>FitPass Partner •</Text>
                        <Star size={11} color={theme.colors.brandLight} fill={theme.colors.brandLight} />
                        <Text style={[styles.modalGymSub, { color: theme.colors.brandLight }]}>{selectedGym.discoveryProfile?.rating || 4.8}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.modalBody}>
                  {/* Action Buttons: Min tap target 44px */}
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtnCall, { backgroundColor: theme.colors.primary }]}
                      onPress={() => handleCall(selectedGym.discoveryProfile?.contactNumber || selectedGym.phone)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Call gym"
                    >
                      <Phone size={14} color={theme.colors.background} />
                      <Text style={[styles.actionBtnCallText, { color: theme.colors.background }]}>Call Gym</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtnNav, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                      onPress={() => handleDirections(selectedGym)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Get directions"
                    >
                      <Navigation size={14} color={theme.colors.text} />
                      <Text style={[styles.actionBtnNavText, { color: theme.colors.text }]}>Directions</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.modalSectionTitle, { color: theme.colors.primary }]}>About Gym</Text>
                  <Text style={[styles.modalDesc, { color: theme.colors.textSecondary }]}>
                    {selectedGym.discoveryProfile?.description || selectedGym.discoveryProfile?.shortDescription}
                  </Text>

                  <Text style={[styles.modalSectionTitle, { color: theme.colors.primary }]}>Operating Hours</Text>
                  <Text style={[styles.modalDesc, { color: theme.colors.textSecondary }]}>
                    {selectedGym.discoveryProfile?.openingTime} - {selectedGym.discoveryProfile?.closingTime}
                  </Text>

                  <Text style={[styles.modalSectionTitle, { color: theme.colors.primary }]}>Amenities Available</Text>
                  <View style={styles.chipsWrap}>
                    {selectedGym.discoveryProfile?.amenities?.map((item) => (
                      <View key={item} style={[styles.amenityChip, styles.chipRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Check size={12} color={theme.colors.success} />
                        <Text style={[styles.amenityChipText, { color: theme.colors.text }]}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.modalSectionTitle, { color: theme.colors.primary }]}>Equipment Available</Text>
                  <View style={styles.chipsWrap}>
                    {selectedGym.discoveryProfile?.equipments?.map((item) => (
                      <View key={item} style={[styles.equipmentChip, styles.chipRow, { backgroundColor: theme.colors.card }]}>
                        <Dumbbell size={12} color={theme.colors.textSecondary} />
                        <Text style={[styles.equipmentChipText, { color: theme.colors.textSecondary }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
  },
  categoryScroll: {
    maxHeight: 50,
    marginVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    height: 38,
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  postsSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 10,
  },
  postCard: {
    width: 180,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
  },
  postCardImage: {
    width: '100%',
    height: 110,
  },
  postCardBody: {
    padding: 8,
  },
  postGymName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  postTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  listSection: {
    paddingHorizontal: 16,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  gymCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  coverWrapper: {
    position: 'relative',
    height: 160,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  logoImage: {
    position: 'absolute',
    bottom: -16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  statusPillsRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gymCardContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gymTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  gymAddress: {
    fontSize: 12,
  },
  gymDesc: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  detailsBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44, // AGENTS.md touch target rule
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalCoverWrapper: {
    position: 'relative',
    height: 200,
  },
  modalCoverImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderInfo: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  modalGymTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalGymSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modalBody: {
    padding: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  actionBtnCallText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionBtnNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    borderWidth: 1,
  },
  actionBtnNavText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  amenityChipText: {
    fontSize: 12,
  },
  equipmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  equipmentChipText: {
    fontSize: 12,
  },
});
