import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { UserCheck, Calendar, Clock, PackageCheck, Award } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge, Skeleton } from '@/components/ui';
import { API_CLIENT } from '@/lib/api-client';
import { H4TopHeader } from './H4TopHeader';

interface PTSession {
  _id: string;
  id?: string;
  sessionDate: string;
  status: string;
  notes?: string;
  trainer?: {
    id: string;
    name: string;
    email: string;
  };
  package?: {
    id: string;
    name: string;
    price: number;
    sessionCount: number;
  };
}

export function H4PTSessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<PTSession[]>([]);

  const fetchPTSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API_CLIENT.get('/pt-sessions');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch PT sessions:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPTSessions();
  }, [fetchPTSessions]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <H4TopHeader title="PT Coaching" />
        <View style={styles.content}>
          <Skeleton height={60} borderRadius={16} style={{ marginBottom: 14 }} />
          <Skeleton height={140} borderRadius={20} style={{ marginBottom: 14 }} />
          <Skeleton height={140} borderRadius={20} />
        </View>
      </View>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'active';
      case 'cancelled':
        return 'expired';
      default:
        return 'info';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <H4TopHeader title="PT Coaching" />
      <ScrollView style={[styles.root, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerGroup}>
          <View style={[styles.headerIconWrap, { backgroundColor: `${theme.colors.primary}1F` }]}>
            <Award size={18} color={theme.colors.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h2" style={[styles.headerTitle, { color: theme.colors.text }]}>1-on-1 Sessions</Typography>
            <Typography variant="caption" color="secondary" style={styles.headerSub}>
              Track scheduled workout bookings & active training packages
            </Typography>
          </View>
        </View>

        {sessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: `${theme.colors.primary}1F` }]}>
              <UserCheck size={28} color={theme.colors.primary} />
            </View>
            <Typography variant="bodySm" style={[styles.emptyTitle, { color: theme.colors.text }]}>No PT Sessions Scheduled</Typography>
            <Typography variant="caption" color="secondary" style={styles.emptyDesc}>
              You currently have no 1-on-1 sessions scheduled. Contact your H4 coach or admin to book a PT package.
            </Typography>
          </Card>
        ) : (
          <View style={styles.sessionList}>
            {sessions.map((s) => {
              const sessionId = s._id || s.id || '';
              const sessionDateObj = new Date(s.sessionDate);
              const dateStr = sessionDateObj.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = sessionDateObj.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={sessionId} style={[styles.sessionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.trainerGroup}>
                      <View style={[styles.trainerAvatar, { backgroundColor: `${theme.colors.primary}1F`, borderColor: `${theme.colors.primary}4D` }]}>
                        <Text style={[styles.trainerAvatarText, { color: theme.colors.primary }]}>
                          {(s.trainer?.name?.[0] || 'T').toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Typography variant="h3" style={[styles.trainerName, { color: theme.colors.text }]}>
                          {s.trainer?.name || 'Assigned Coach'}
                        </Typography>
                        <Typography variant="caption" color="secondary" style={styles.trainerRole}>
                          H4 Personal Trainer
                        </Typography>
                      </View>
                    </View>
                    <Badge label={s.status} variant={getStatusVariant(s.status)} />
                  </View>

                  {/* Divider line */}
                  <View style={[styles.cardDivider, { backgroundColor: theme.colors.border }]} />

                  {/* Session Date and Time */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={theme.colors.primary} />
                      <Typography variant="caption" style={[styles.metaText, { color: theme.colors.textSecondary }]}>{dateStr}</Typography>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={theme.colors.primary} />
                      <Typography variant="caption" style={[styles.metaText, { color: theme.colors.textSecondary }]}>{timeStr}</Typography>
                    </View>
                  </View>

                  {/* PT package block */}
                  {s.package ? (
                    <View style={[styles.packageBanner, { backgroundColor: `${theme.colors.primary}14`, borderColor: `${theme.colors.primary}40` }]}>
                      <PackageCheck size={14} color={theme.colors.primary} />
                      <Typography variant="caption" style={[styles.packageText, { color: theme.colors.textSecondary }]}>
                        Package: <Typography variant="caption" style={{ color: theme.colors.text, fontWeight: '800' }}>{s.package.name}</Typography> ({s.package.sessionCount} Sessions)
                      </Typography>
                    </View>
                  ) : null}

                  {/* Trainer notes */}
                  {s.notes ? (
                    <View style={[styles.notesBox, { backgroundColor: theme.colors.bgTertiary, borderColor: theme.colors.border }]}>
                      <Typography variant="caption" color="secondary" style={styles.notesLabel}>Coach Feedback:</Typography>
                      <Typography variant="bodySm" color="secondary" style={styles.notesContent}>{s.notes}</Typography>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 18, paddingBottom: 100, gap: 16 },
  loadingContainer: { flex: 1 },

  headerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 20
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },

  emptyCard: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontWeight: '800', fontSize: 16 },
  emptyDesc: { textAlign: 'center', fontSize: 12, lineHeight: 18 },

  sessionList: { gap: 14 },
  sessionCard: {
    padding: 16,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trainerGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trainerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainerAvatarText: {
    fontSize: 16,
    fontWeight: '900',
  },
  trainerName: { fontWeight: '800', fontSize: 14 },
  trainerRole: { fontSize: 11, marginTop: 1 },

  cardDivider: {
    height: 1,
  },

  metaRow: { flexDirection: 'row', gap: 16, paddingVertical: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontWeight: '700', fontSize: 12 },

  packageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  packageText: { fontSize: 11 },

  notesBox: {
    padding: 12,
    borderRadius: 10,
    gap: 2,
    borderWidth: 1,
  },
  notesLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  notesContent: { fontSize: 12, lineHeight: 16, marginTop: 1 },
});
