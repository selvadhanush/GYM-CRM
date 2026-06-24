import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/stores/auth';
import { adminService } from '@/services/admin';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '@/theme';

export default function AdminProfileScreen() {
  const { user, logout } = useAuthStore();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGymData();
  }, []);

  const fetchGymData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPartneredGyms();
      const myGym = data.find((g: any) => g.id === user?.gymId || g._id === user?.gymId);
      if (myGym) {
        setImages(myGym.images || []);
      }
    } catch (err) {
      console.warn('Failed to load gym images:', err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const maxSelectable = 5 - images.length;
    if (maxSelectable <= 0) {
      Alert.alert('Limit Reached', 'You can only have up to 5 images in your gallery.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxSelectable,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleUpload(result.assets);
    }
  };

  const handleUpload = async (assets: ImagePicker.ImagePickerAsset[]) => {
    try {
      setUploading(true);
      const uploadAssets = assets.map(asset => {
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
        const fileName = asset.uri.split('/').pop() || `upload.${fileType}`;
        return { uri: asset.uri, name: fileName, type: mimeType };
      });

      const res = await adminService.uploadGymImages(uploadAssets);
      setImages(res.images);
      Alert.alert('Success', 'Images uploaded successfully!');
    } catch (err: any) {
      console.error('Upload Error', err);
      Alert.alert('Error', err.message || 'Failed to upload images.');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (indexToDelete: number) => {
    Alert.alert('Delete Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setUploading(true);
            const newImages = images.filter((_, idx) => idx !== indexToDelete);
            const res = await adminService.updateGymImages(newImages);
            setImages(res.images);
          } catch (err) {
            console.error('Delete Error', err);
            Alert.alert('Error', 'Failed to delete image.');
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.name || 'Administrator'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
          <Text style={styles.roleText}>Admin</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Gym Details</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="business" label="Gym Name" value={user?.gymName || 'FitPrime'} />
          <InfoRow icon="location" label="Location" value="Main Branch" />
          <InfoRow icon="calendar" label="Platform Since" value="Jan 2026" isLast />
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Gym Gallery</Text>
          <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.uploadBtn}>
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="cloud-upload" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: SPACING.md }} />
          ) : images.length > 0 ? (
            <View style={styles.galleryGrid}>
              {images.map((imgUri, idx) => (
                <View key={idx} style={styles.imageContainer}>
                  <Image source={{ uri: imgUri }} style={styles.gymImage} />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteImage(idx)}
                    disabled={uploading}
                  >
                    <Ionicons name="trash" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No images uploaded yet.</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, isLast = false }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 80,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: FONTS.sizes.hero,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  profileName: {
    fontSize: FONTS.sizes.xxl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  profileEmail: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    marginTop: SPACING.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    ...FONTS.medium,
  },
  infoSection: {
    marginBottom: SPACING.xxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    ...FONTS.semibold,
  },
  uploadBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    ...FONTS.regular,
    width: 90,
  },
  infoValue: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    ...FONTS.medium,
    textAlign: 'right',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  gymImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceLight,
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: RADIUS.full,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.md,
    ...FONTS.semibold,
  },
});
