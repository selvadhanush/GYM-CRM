import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Skeleton } from '@/components/ui';
import { useH4Attendance } from '@/features/h4';
import { CalendarCheck } from 'lucide-react-native';
import { View } from 'react-native';

export default function H4AttendanceScreen() {
  const { data, isLoading } = useH4Attendance();

  const records = data?.data ?? [];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h2" style={styles.title}>Attendance</Typography>
        {isLoading
          ? [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} style={styles.skeleton} />)
          : records.length === 0
          ? (
            <Card style={styles.emptyCard}>
              <Typography variant="bodySm" color="secondary">No attendance records found.</Typography>
            </Card>
          )
          : records.map((rec) => (
            <Card key={rec.id} style={styles.row}>
              <View style={styles.dot} />
              <View>
                <Typography variant="bodySm">
                  {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Typography>
                <Typography variant="caption" color="secondary">
                  Check-in: {rec.checkInTime}
                  {rec.checkOutTime ? ` · Check-out: ${rec.checkOutTime}` : ''}
                </Typography>
              </View>
            </Card>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  title: { color: theme.colors.text, marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.sm, marginBottom: theme.spacing.xs },
  dot: { width: 8, height: 8, borderRadius: theme.radii.full, backgroundColor: theme.colors.success },
  emptyCard: { padding: theme.spacing.md, alignItems: 'center' },
  skeleton: { height: 64, borderRadius: theme.radii.md, marginBottom: theme.spacing.xs },
});
