import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X, Dumbbell, MapPin, Search, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { fontFamilies } from '@/design-system/tokens';

export interface GymSelectItem {
  id: string;
  _id?: string;
  name: string;
  address?: string;
  isHomeGym?: boolean;
}

interface GymSelectModalProps {
  visible: boolean;
  onClose: () => void;
  locations: GymSelectItem[];
  search: string;
  onSearchChange: (text: string) => void;
  onSelect: (gym: GymSelectItem) => void;
  badgeText: string;
  title: string;
  searchPlaceholder?: string;
  /** Portal accent — theme.colors.primary for H4, theme.colors.fitpassAccent for FitPass */
  accentColor?: string;
}

// Shared manual gym/branch picker used by both H4QRScan and FitPassQRScan —
// previously ~350 lines of near-identical markup/styles were pasted into
// each screen separately (and in H4QRScan's case, twice in the same file).
export const GymSelectModal: React.FC<GymSelectModalProps> = ({
  visible,
  onClose,
  locations,
  search,
  onSearchChange,
  onSelect,
  badgeText,
  title,
  searchPlaceholder = 'Search location...',
  accentColor = theme.colors.primary,
}) => {
  const filtered = locations.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.modalBadgeRow}>
              <ShieldCheck size={13} color={accentColor} />
              <Text style={[styles.modalBadgeText, { color: accentColor }]}>{badgeText}</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
          </View>
          <TouchableOpacity
            style={[styles.modalCloseBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.modalSearchBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.modalSearchInput, { color: theme.colors.text }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={onSearchChange}
          />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
          {filtered.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.gymRow,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                g.isHomeGym && { borderColor: `${accentColor}66`, backgroundColor: `${accentColor}0D` },
              ]}
              onPress={() => onSelect(g)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Check in at ${g.name}`}
            >
              <View style={[styles.gymIconBox, { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}40` }]}>
                <Dumbbell size={20} color={accentColor} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.gymRowName, { color: theme.colors.text }]}>{g.name}</Text>
                  {g.isHomeGym && (
                    <View style={[styles.homePill, { backgroundColor: `${accentColor}26` }]}>
                      <Text style={[styles.homePillText, { color: accentColor }]}>REGISTERED HOME</Text>
                    </View>
                  )}
                </View>
                {g.address ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} color={theme.colors.textMuted} />
                    <Text style={[styles.gymRowAddress, { color: theme.colors.textMuted }]} numberOfLines={1}>
                      {g.address}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={[styles.checkInChip, { backgroundColor: accentColor }]}>
                <Text style={styles.checkInChipText}>Check In</Text>
                <ArrowRight size={12} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: { flex: 1, padding: 20, paddingTop: 50, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  modalBadgeText: { fontFamily: fontFamilies.header, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  modalTitle: { fontFamily: fontFamilies.header, fontSize: 22, fontWeight: '800', marginTop: 2 },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalSearchInput: { flex: 1, fontFamily: fontFamilies.body, fontSize: 14 },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  gymIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gymRowName: { fontFamily: fontFamilies.header, fontSize: 15, fontWeight: '800' },
  homePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  homePillText: { fontSize: 9, fontWeight: '900' },
  gymRowAddress: { fontFamily: fontFamilies.body, fontSize: 12, flex: 1 },
  checkInChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  checkInChipText: { fontFamily: fontFamilies.header, fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});
