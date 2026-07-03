import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Modal as RNModal } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MapPin, User, Settings, Edit3, Trash2, QrCode, Phone, Mail, Users, DollarSign } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { 
  usePartnerGyms, 
  useCreatePartnerGym, 
  useUpdatePartnerGym, 
  useDeletePartnerGym, 
  Gym,
  Branch,
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch
} from '../api/superadmin.api';
import { Card, Button, Input, Select, Modal, Skeleton, EmptyState, Typography } from '@/components/ui';

export const PartnerGymsList: React.FC = () => {
  const toast = useToast();
  const { activeDivision, selectedGymId } = useAuth();
  
  // Queries
  const { data: gyms, isLoading: gymsLoading } = usePartnerGyms();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  
  // Mutations
  const createGymMutation = useCreatePartnerGym();
  const updateGymMutation = useUpdatePartnerGym();
  const deleteGymMutation = useDeletePartnerGym();
  
  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();
  const deleteBranchMutation = useDeleteBranch();

  // Create Form States (Shared/Mapped)
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [sessionHours, setSessionHours] = useState<string | number>('2');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Modals & Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [qrGym, setQrGym] = useState<Gym | null>(null);
  const [qrBranch, setQrBranch] = useState<Branch | null>(null);

  const isH4 = activeDivision === 'h4';
  const isLoading = isH4 ? branchesLoading : gymsLoading;

  const handleCreate = async () => {
    if (isH4) {
      if (!name) {
        toast.show('Branch name is required', 'error');
        return;
      }
      createBranchMutation.mutate({
        name,
        address,
        phone,
        email,
        managerName,
        fitPassEnabled: true
      }, {
        onSuccess: () => {
          toast.show('H4 Branch created successfully!', 'success');
          resetForm();
          setShowCreateModal(false);
        },
        onError: (err: any) => {
          toast.show(err.response?.data?.message || 'Failed to create branch', 'error');
        }
      });
    } else {
      if (!name || !address || !adminName || !email || !adminPassword) {
        toast.show('Please fill in all required fields', 'error');
        return;
      }
      createGymMutation.mutate({
        gymName: name,
        gymAddress: address,
        defaultSessionDurationMinutes: Number(sessionHours) * 60 || 120,
        adminName,
        adminEmail: email,
        adminPassword,
      }, {
        onSuccess: () => {
          toast.show('Partner gym created successfully!', 'success');
          resetForm();
          setShowCreateModal(false);
        },
        onError: (err: any) => {
          toast.show(err.response?.data?.message || 'Failed to create gym', 'error');
        }
      });
    }
  };

  const handleUpdate = () => {
    if (isH4) {
      if (!editingBranch) return;
      if (!editingBranch.name) {
        toast.show('Branch name is required', 'error');
        return;
      }
      updateBranchMutation.mutate({
        id: editingBranch._id,
        name: editingBranch.name,
        address: editingBranch.address,
        phone: editingBranch.phone,
        email: editingBranch.email,
        managerName: editingBranch.managerName,
      }, {
        onSuccess: () => {
          toast.show('H4 Branch details updated!', 'success');
          setEditingBranch(null);
        },
        onError: (err: any) => {
          toast.show(err.response?.data?.message || 'Failed to update branch', 'error');
        }
      });
    } else {
      if (!editingGym) return;
      if (!editingGym.name || !editingGym.address) {
        toast.show('Please fill in all details', 'error');
        return;
      }
      updateGymMutation.mutate({
        id: editingGym._id,
        name: editingGym.name,
        address: editingGym.address,
      }, {
        onSuccess: () => {
          toast.show('Partner gym details updated!', 'success');
          setEditingGym(null);
        },
        onError: (err: any) => {
          toast.show(err.response?.data?.message || 'Failed to update details', 'error');
        }
      });
    }
  };

  const handleSaveDuration = (gymId: string, hours: number) => {
    updateGymMutation.mutate({
      id: gymId,
      defaultSessionDurationMinutes: hours * 60,
    }, {
      onSuccess: () => {
        toast.show('Check-in session duration updated!', 'success');
      },
      onError: (err: any) => {
        toast.show(err.response?.data?.message || 'Failed to save configuration', 'error');
      }
    });
  };

  const handleDelete = (id: string) => {
    const title = isH4 ? 'Delete H4 Branch' : 'Delete Partner Gym';
    const msg = isH4 
      ? 'Are you sure you want to delete this branch? This action is permanent.'
      : 'Are you sure you want to delete this gym and its associated admins? This action is permanent and cannot be undone.';
    
    Alert.alert(
      title,
      msg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (isH4) {
              deleteBranchMutation.mutate(id, {
                onSuccess: () => {
                  toast.show('H4 Branch deleted successfully.', 'success');
                },
                onError: (err: any) => {
                  toast.show(err.response?.data?.message || 'Failed to delete branch', 'error');
                }
              });
            } else {
              deleteGymMutation.mutate(id, {
                onSuccess: () => {
                  toast.show('Partner gym deleted successfully.', 'success');
                },
                onError: (err: any) => {
                  toast.show(err.response?.data?.message || 'Failed to delete gym', 'error');
                }
              });
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setManagerName('');
    setSessionHours('2');
    setAdminName('');
    setAdminPassword('');
  };

  if (isLoading) {
    return (
      <View>
        <Skeleton height={48} style={{ marginBottom: theme.spacing.lg }} />
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} height={140} style={{ marginBottom: theme.spacing.md }} />
        ))}
      </View>
    );
  }

  const durationOptions = [
    { label: '1 Hour', value: 1 },
    { label: '2 Hours', value: 2 },
    { label: '3 Hours', value: 3 },
    { label: '4 Hours', value: 4 },
    { label: '5 Hours', value: 5 },
    { label: '6 Hours', value: 6 },
  ];

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Button
        title={isH4 ? '+ Create H4 Branch' : '+ Create New Partner Gym'}
        onPress={() => {
          resetForm();
          setShowCreateModal(true);
        }}
        style={{ marginBottom: theme.spacing.lg }}
      />

      {isH4 ? (
        // H4 BRANCHES LIST
        branches?.length === 0 ? (
          <EmptyState
            iconText="🏢"
            title="No H4 Branches Found"
            description="Create H4 physical branches to manage H4 locations and check-ins."
          />
        ) : (
          branches?.map((branch) => (
            <Card key={branch._id} style={styles.gymCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Typography variant="h3" style={styles.gymName}>{branch.name}</Typography>
                  <View style={styles.metaRow}>
                    <MapPin size={14} color={theme.colors.textSecondary} />
                    <Typography variant="caption" color="secondary" style={styles.metaText} numberOfLines={1}>
                      {branch.address || 'No Address Specified'}
                    </Typography>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setQrBranch(branch)}
                  style={styles.qrIconWrapper}
                  activeOpacity={0.7}
                >
                  <QrCode color={theme.colors.primary} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailSection}>
                <View style={styles.metaRow}>
                  <User size={14} color={theme.colors.textSecondary} />
                  <Typography variant="bodySm" color="secondary" style={styles.adminLabel}>
                    Manager: {branch.managerName || 'N/A'}
                  </Typography>
                </View>

                {branch.phone && (
                  <View style={styles.metaRow}>
                    <Phone size={14} color={theme.colors.textSecondary} />
                    <Typography variant="bodySm" color="secondary" style={styles.adminLabel}>
                      Phone: {branch.phone}
                    </Typography>
                  </View>
                )}

                {branch.email && (
                  <View style={styles.metaRow}>
                    <Mail size={14} color={theme.colors.textSecondary} />
                    <Typography variant="bodySm" color="secondary" style={styles.adminLabel}>
                      Email: {branch.email}
                    </Typography>
                  </View>
                )}

                <View style={styles.statsMetricsRow}>
                  <View style={styles.statMetric}>
                    <Users size={14} color={theme.colors.primary} />
                    <Typography variant="caption" color="brand">
                      {branch.memberCount || 0} Members
                    </Typography>
                  </View>
                  <View style={styles.statMetric}>
                    <DollarSign size={14} color={theme.colors.success} />
                    <Typography variant="caption" color="success">
                      ₹{branch.totalRevenue || 0}
                    </Typography>
                  </View>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Button
                  title="Edit"
                  variant="secondary"
                  icon={<Edit3 size={14} color={theme.colors.text} />}
                  onPress={() => setEditingBranch(branch)}
                  style={styles.actionBtn}
                />
                <Button
                  title="Delete"
                  variant="danger"
                  icon={<Trash2 size={14} color={theme.colors.error} />}
                  onPress={() => handleDelete(branch._id)}
                  style={styles.actionBtn}
                />
              </View>
            </Card>
          ))
        )
      ) : (
        // FITPASS PARTNER GYMS LIST
        gyms?.length === 0 ? (
          <EmptyState
            iconText="🏢"
            title="No Partner Gyms Found"
            description="Create a partner gym above to begin onboarding subscriptions and gym systems."
          />
        ) : (
          gyms?.map((gym) => {
            const currentHours = (gym.defaultSessionDurationMinutes || 120) / 60;
            return (
              <Card key={gym._id} style={styles.gymCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3" style={styles.gymName}>{gym.name}</Typography>
                    <View style={styles.metaRow}>
                      <MapPin size={14} color={theme.colors.textSecondary} />
                      <Typography variant="caption" color="secondary" style={styles.metaText} numberOfLines={1}>
                        {gym.address}
                      </Typography>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setQrGym(gym)}
                    style={styles.qrIconWrapper}
                    activeOpacity={0.7}
                  >
                    <QrCode color={theme.colors.primary} size={20} />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailSection}>
                  <View style={styles.metaRow}>
                    <User size={14} color={theme.colors.textSecondary} />
                    <Typography variant="bodySm" color="secondary" style={styles.adminLabel}>
                      Admin: {gym.admins?.[0]?.name || 'N/A'} ({gym.admins?.[0]?.email || ''})
                    </Typography>
                  </View>

                  <View style={styles.durationSelector}>
                    <Settings size={14} color={theme.colors.textSecondary} />
                    <Typography variant="bodySm" color="secondary" style={styles.durationText}>Session Limit:</Typography>
                    <View style={styles.selectWrapper}>
                      <Select
                        label=""
                        placeholder="Hours"
                        options={durationOptions}
                        value={currentHours}
                        onValueChange={(val) => handleSaveDuration(gym._id, Number(val))}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <Button
                    title="Edit"
                    variant="secondary"
                    icon={<Edit3 size={14} color={theme.colors.text} />}
                    onPress={() => setEditingGym(gym)}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Delete"
                    variant="danger"
                    icon={<Trash2 size={14} color={theme.colors.error} />}
                    onPress={() => handleDelete(gym._id)}
                    style={styles.actionBtn}
                  />
                </View>
              </Card>
            );
          })
        )
      )}

      {/* CREATE MODAL */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={isH4 ? 'Create H4 Branch' : 'Create Partner Gym'}
      >
        <Input 
          label={isH4 ? 'Branch Name *' : 'Gym Name *'} 
          value={name} 
          onChangeText={setName} 
          placeholder={isH4 ? 'e.g. H4 Fitness South End' : 'e.g. Titan Strength Hub'} 
        />
        <Input 
          label={isH4 ? 'Branch Address' : 'Gym Address *'} 
          value={address} 
          onChangeText={setAddress} 
          placeholder="e.g. 52 Fit Street, Landmark" 
        />
        
        {isH4 ? (
          <>
            <Input 
              label="Manager Name" 
              value={managerName} 
              onChangeText={setManagerName} 
              placeholder="e.g. Sanjai Pandian" 
            />
            <Input 
              label="Phone Number" 
              value={phone} 
              onChangeText={setPhone} 
              placeholder="e.g. +91 98765 43210" 
              keyboardType="phone-pad"
            />
            <Input 
              label="Email Address" 
              value={email} 
              onChangeText={setEmail} 
              placeholder="e.g. south@h4gyms.com" 
              keyboardType="email-address"
            />
          </>
        ) : (
          <>
            <Select
              label="Default Session Limit *"
              options={[
                { label: '1 Hour', value: '1' },
                { label: '2 Hours', value: '2' },
                { label: '3 Hours', value: '3' },
                { label: '4 Hours', value: '4' },
              ]}
              value={sessionHours}
              onValueChange={setSessionHours}
            />

            <View style={styles.modalSectionHeader}>
              <Typography variant="body" style={styles.modalSectionTitle}>Owner / Admin Credentials</Typography>
            </View>

            <Input 
              label="Admin Account Name *" 
              value={adminName} 
              onChangeText={setAdminName} 
              placeholder="e.g. John Doe" 
            />
            <Input 
              label="Admin Account Email *" 
              value={email} 
              onChangeText={setEmail} 
              placeholder="e.g. admin@gym.com" 
              keyboardType="email-address"
            />
            <Input 
              label="Admin Account Password *" 
              value={adminPassword} 
              onChangeText={setAdminPassword} 
              placeholder="••••••••" 
              secureTextEntry 
            />
          </>
        )}

        <Button
          title={isH4 ? 'Create Branch' : 'Create Partner Gym'}
          loading={isH4 ? createBranchMutation.isPending : createGymMutation.isPending}
          onPress={handleCreate}
          style={{ marginTop: theme.spacing.lg }}
        />
      </Modal>

      {/* EDIT MODAL */}
      {isH4 ? (
        <Modal
          visible={editingBranch !== null}
          onClose={() => setEditingBranch(null)}
          title="Edit Branch Details"
        >
          {editingBranch && (
            <>
              <Input
                label="Branch Name *"
                value={editingBranch.name}
                onChangeText={(val) => setEditingBranch({ ...editingBranch, name: val })}
              />
              <Input
                label="Branch Address"
                value={editingBranch.address || ''}
                onChangeText={(val) => setEditingBranch({ ...editingBranch, address: val })}
              />
              <Input
                label="Manager Name"
                value={editingBranch.managerName || ''}
                onChangeText={(val) => setEditingBranch({ ...editingBranch, managerName: val })}
              />
              <Input
                label="Phone Number"
                value={editingBranch.phone || ''}
                onChangeText={(val) => setEditingBranch({ ...editingBranch, phone: val })}
                keyboardType="phone-pad"
              />
              <Input
                label="Email Address"
                value={editingBranch.email || ''}
                onChangeText={(val) => setEditingBranch({ ...editingBranch, email: val })}
                keyboardType="email-address"
              />
              <Button
                title="Save Branch Details"
                loading={updateBranchMutation.isPending}
                onPress={handleUpdate}
                style={{ marginTop: theme.spacing.lg }}
              />
            </>
          )}
        </Modal>
      ) : (
        <Modal
          visible={editingGym !== null}
          onClose={() => setEditingGym(null)}
          title="Edit Partner Gym"
        >
          {editingGym && (
            <>
              <Input
                label="Gym Name *"
                value={editingGym.name}
                onChangeText={(val) => setEditingGym({ ...editingGym, name: val })}
              />
              <Input
                label="Gym Address *"
                value={editingGym.address}
                onChangeText={(val) => setEditingGym({ ...editingGym, address: val })}
              />
              <Button
                title="Save Gym Details"
                loading={updateGymMutation.isPending}
                onPress={handleUpdate}
                style={{ marginTop: theme.spacing.lg }}
              />
            </>
          )}
        </Modal>
      )}

      {/* QR MODALS */}
      <RNModal
        visible={qrGym !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setQrGym(null)}
      >
        <TouchableOpacity
          style={styles.qrOverlay}
          activeOpacity={1}
          onPress={() => setQrGym(null)}
        >
          <View style={styles.qrCard} onStartShouldSetResponder={() => true}>
            <Typography variant="h3" style={styles.qrTitle}>{qrGym?.name}</Typography>
            <Typography variant="caption" color="secondary" style={styles.qrSubtitle}>
              Members scan this QR code on check-in to access this gym location.
            </Typography>
            <View style={styles.qrWrapper}>
              {qrGym && (
                <QRCode
                  value={JSON.stringify({ gymId: qrGym._id, gymName: qrGym.name })}
                  size={200}
                  backgroundColor="#fff"
                />
              )}
            </View>
            <Button
              title="Close"
              variant="secondary"
              onPress={() => setQrGym(null)}
              style={{ marginTop: theme.spacing.lg, width: '100%' }}
            />
          </View>
        </TouchableOpacity>
      </RNModal>

      <RNModal
        visible={qrBranch !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setQrBranch(null)}
      >
        <TouchableOpacity
          style={styles.qrOverlay}
          activeOpacity={1}
          onPress={() => setQrBranch(null)}
        >
          <View style={styles.qrCard} onStartShouldSetResponder={() => true}>
            <Typography variant="h3" style={styles.qrTitle}>{qrBranch?.name}</Typography>
            <Typography variant="caption" color="secondary" style={styles.qrSubtitle}>
              Members scan this QR code on check-in to access this H4 branch.
            </Typography>
            <View style={styles.qrWrapper}>
              {qrBranch && selectedGymId && (
                <QRCode
                  value={JSON.stringify({ gymId: selectedGymId, branchId: qrBranch._id, gymName: qrBranch.name })}
                  size={200}
                  backgroundColor="#fff"
                />
              )}
            </View>
            <Button
              title="Close"
              variant="secondary"
              onPress={() => setQrBranch(null)}
              style={{ marginTop: theme.spacing.lg, width: '100%' }}
            />
          </View>
        </TouchableOpacity>
      </RNModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  gymCard: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  gymName: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  qrIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.brandMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  detailSection: {
    gap: theme.spacing.xs,
  },
  adminLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  durationText: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  selectWrapper: {
    width: 140,
    height: 40,
    marginLeft: theme.spacing.sm,
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
  },
  modalSectionHeader: {
    marginTop: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  modalSectionTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  qrCard: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  qrTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  qrSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.xl,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  statsMetricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  statMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.bgTertiary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
