import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { theme, useThemeStore } from '@/design-system/theme';
import { Typography, Card, Badge, Skeleton, Input, Modal, Button } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useSessionStatus } from '../api/fitpass.api';
import { User, Mail, Phone, Building2, Ticket, Moon, Sun, Edit2 } from 'lucide-react-native';
import { API_CLIENT } from '@/lib/api-client';

export function FitPassProfile() {
  const user = useAuth((s) => s.user);
  const updateUserLocal = useAuth((s) => s.updateUserLocal);
  const { data: session, isLoading } = useSessionStatus();
  const { toggleTheme } = useThemeStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '');
  const [profilePassword, setProfilePassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleOpenEdit = () => {
    setProfileName(user?.name ?? '');
    setProfileEmail(user?.email ?? '');
    setProfilePhone(user?.phone ?? '');
    setProfilePassword('');
    setIsModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setUpdating(true);
    try {
      await API_CLIENT.put('/member-portal/profile', {
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        password: profilePassword || undefined,
      });
      await updateUserLocal({
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile.'
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h1" style={styles.title}>Profile</Typography>

      {/* User Info */}
      <Card style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Typography variant="h1" style={{ color: theme.colors.primary }}>
              {(user?.name?.[0] ?? 'F').toUpperCase()}
            </Typography>
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h2">{user?.name ?? '—'}</Typography>
            <Badge label="FitPass Member" variant="info" />
          </View>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Mail size={14} color={theme.colors.textSecondary} />
            <Typography variant="bodySm" color="secondary">{user?.email ?? '—'}</Typography>
          </View>
          {user?.phone && (
            <View style={styles.infoRow}>
              <Phone size={14} color={theme.colors.textSecondary} />
              <Typography variant="bodySm" color="secondary">{user.phone}</Typography>
            </View>
          )}
        </View>

        <Button
          title="Edit Profile"
          onPress={handleOpenEdit}
          variant="secondary"
          icon={<Edit2 size={16} color={theme.colors.text} />}
          style={{ marginTop: theme.spacing.sm }}
        />
      </Card>

      {/* Pass Status */}
      <Card style={styles.card}>
        <Typography variant="h3" style={styles.cardTitle}>Pass Status</Typography>
        {isLoading ? (
          <Skeleton style={{ height: 80, borderRadius: theme.radii.md }} />
        ) : (
          <View style={styles.passGrid}>
            <View style={styles.passStat}>
              <Typography variant="h1" style={{ color: theme.colors.primary }}>
                {session?.sessionsRemaining ?? 0}
              </Typography>
              <Typography variant="caption" color="secondary">Sessions Left</Typography>
            </View>
            <View style={styles.passStat}>
              <Badge
                label={session?.planStatus ?? 'Unknown'}
                variant={session?.planStatus === 'Active' ? 'active' : 'expired'}
              />
            </View>
          </View>
        )}
      </Card>

      {/* Settings / Theme Mode */}
      <Card style={styles.card}>
        <Typography variant="h3" style={styles.cardTitle}>App Settings</Typography>
        <View style={styles.settingsRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            {theme.dark ? (
              <Moon size={18} color={theme.colors.primary} />
            ) : (
              <Sun size={18} color={theme.colors.primary} />
            )}
            <Typography variant="bodySm">Dark Theme</Typography>
          </View>
          <Switch
            value={theme.dark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor={theme.dark ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </Card>

      <Modal visible={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Profile">
        <View style={{ gap: theme.spacing.sm }}>
          <Input
            label="Name"
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Enter your name"
          />
          <Input
            label="Email"
            value={profileEmail}
            onChangeText={setProfileEmail}
            placeholder="Enter your email address"
            keyboardType="email-address"
          />
          <Input
            label="Phone"
            value={profilePhone}
            onChangeText={setProfilePhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
          <Input
            label="New Password (optional)"
            value={profilePassword}
            onChangeText={setProfilePassword}
            placeholder="Leave blank to keep current"
            secureTextEntry
          />
          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            loading={updating}
            style={{ marginTop: theme.spacing.md }}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  title: { color: theme.colors.text, marginBottom: theme.spacing.md },
  card: { padding: theme.spacing.md, marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  cardTitle: { color: theme.colors.text, marginBottom: theme.spacing.sm },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoList: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  passGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  passStat: { alignItems: 'center', gap: theme.spacing.xs },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.xs },
});
