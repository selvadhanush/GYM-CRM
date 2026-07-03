import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, Users, Target, Package, Calendar, Award, Wrench, ShieldAlert,
  CreditCard, DollarSign, AlertCircle, Scan, MapPin, ClipboardList,
  Snowflake, FileText, BarChart2
} from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card } from '@/components/ui';

interface HubItem {
  key: string;
  name: string;
  icon: React.ReactNode;
}

interface HubGroup {
  title: string;
  items: HubItem[];
}

export const H4ManagementHub: React.FC = () => {
  const router = useRouter();

  const groups: HubGroup[] = [
    {
      title: 'Gym Management',
      items: [
        { key: 'profile', name: 'Gym Profile', icon: <User size={20} color={theme.colors.primary} /> },
        { key: 'members', name: 'Members', icon: <Users size={20} color={theme.colors.primary} /> },
        { key: 'leads', name: 'Leads', icon: <Target size={20} color={theme.colors.primary} /> },
        { key: 'plans', name: 'Plans', icon: <Package size={20} color={theme.colors.primary} /> },
        { key: 'classes', name: 'Classes', icon: <Calendar size={20} color={theme.colors.primary} /> },
        { key: 'assessments', name: 'Assessments', icon: <Award size={20} color={theme.colors.primary} /> },
        { key: 'equipments', name: 'Equipments', icon: <Wrench size={20} color={theme.colors.primary} /> },
        { key: 'staff', name: 'Staff', icon: <ShieldAlert size={20} color={theme.colors.primary} /> },
      ],
    },
    {
      title: 'Gym Ops & Finance',
      items: [
        { key: 'payments', name: 'Payments', icon: <CreditCard size={20} color={theme.colors.success} /> },
        { key: 'expenses', name: 'Expenses', icon: <DollarSign size={20} color={theme.colors.error} /> },
        { key: 'pending_dues', name: 'Pending Dues', icon: <AlertCircle size={20} color={theme.colors.warning} /> },
        { key: 'attendance', name: 'Attendance', icon: <Scan size={20} color={theme.colors.primary} /> },
        { key: 'trainer_attendance', name: 'Trainer Attendance', icon: <MapPin size={20} color={theme.colors.primary} /> },
        { key: 'payroll', name: 'Payroll', icon: <ClipboardList size={20} color={theme.colors.error} /> },
      ],
    },
    {
      title: 'Gym System & Reports',
      items: [
        { key: 'reports', name: 'Reports', icon: <FileText size={20} color={theme.colors.info} /> },
        { key: 'analytics', name: 'Analytics', icon: <BarChart2 size={20} color={theme.colors.info} /> },
        { key: 'freeze_system', name: 'Freeze System', icon: <Snowflake size={20} color={theme.colors.info} /> },
      ],
    },
  ];

  const handlePress = (item: HubItem) => {
    const staticPages = ['attendance', 'trainer_attendance', 'payroll', 'reports', 'analytics'];
    if (staticPages.includes(item.key)) {
      router.push(`/(superadmin)/ops/${item.key}`);
    } else {
      router.push({
        pathname: '/(superadmin)/ops/[module]',
        params: { module: item.key, name: item.name }
      });
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h2" style={styles.sectionHeader}>
        H4 Gym Operations Hub
      </Typography>
      <Typography variant="caption" color="secondary" style={styles.subtitle}>
        Quick access to all H4 physical branches management, staffing, finance and analytics tools.
      </Typography>

      {groups.map((group) => (
        <View key={group.title} style={styles.groupContainer}>
          <Typography variant="body" style={styles.groupTitle}>
            {group.title}
          </Typography>
          <View style={styles.grid}>
            {group.items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.gridItem}
                onPress={() => handlePress(item)}
                activeOpacity={0.8}
              >
                <Card style={styles.hubCard}>
                  <View style={styles.iconWrapper}>
                    {item.icon}
                  </View>
                  <Typography variant="caption" style={styles.cardLabel} numberOfLines={1}>
                    {item.name}
                  </Typography>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: theme.spacing.lg,
  },
  groupContainer: {
    marginBottom: theme.spacing.lg,
  },
  groupTitle: {
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  gridItem: {
    width: '25%',
    padding: theme.spacing.xs,
  },
  hubCard: {
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    backgroundColor: theme.colors.bgTertiary,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardLabel: {
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 10,
  },
});
