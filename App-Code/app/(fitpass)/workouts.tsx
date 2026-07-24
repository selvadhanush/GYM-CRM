import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Dumbbell, CheckCircle2, Flame, Award, Circle } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card } from '@/components/ui';
import { API_CLIENT } from '@/lib/api-client';
import { storage } from '@/lib/storage';
import { useAuth } from '@/features/auth';

export default function WorkoutsScreen() {
  const user = useAuth((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [streak, setStreak] = useState(3);

  useEffect(() => {
    if (user?.id) {
      fetchActivePlan();
      loadStreak();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchActivePlan = async () => {
    try {
      const res = await API_CLIENT.get('/workout-plans');
      // Look for user plan
      if (res.data && res.data.length > 0) {
        // Just take the first plan for now as active plan
        setActivePlan(res.data[0]);
      }
    } catch (err) {
      console.warn("Failed fetching mobile workout plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    if (!user?.id) return;
    const saved = await storage.getItem(`streak_${user.id}`);
    if (saved) setStreak(parseInt(saved));
  };

  const saveStreak = async (newVal: number) => {
    if (!user?.id) return;
    setStreak(newVal);
    await storage.setItem(`streak_${user.id}`, newVal.toString());
  };

  const getExercises = () => {
    if (!activePlan || !activePlan.exercises) return [];
    return activePlan.exercises.filter((ex: any) => ex.day === selectedDay);
  };

  const toggleComplete = (idx: number) => {
    setCompleted(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleLogWorkout = async () => {
    const dayEx = getExercises();
    const count = dayEx.filter((_: any, i: number) => completed[i]).length;
    if (count === 0) return;

    alert(`🎉 Great job! You completed ${count} exercises today.`);
    await saveStreak(streak + 1);
    setCompleted({});
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Card style={styles.streakCard}>
        <View>
          <Typography variant="caption" color="secondary">CONSISTENCY STREAK</Typography>
          <Typography variant="h2" style={{ color: theme.colors.text }}>{streak} Days Active</Typography>
        </View>
        <Flame size={32} color={theme.colors.primary} />
      </Card>

      {!activePlan ? (
        <View style={styles.emptyContainer}>
          <Dumbbell size={48} color={theme.colors.textMuted} />
          <Typography variant="h3" style={styles.emptyTitle}>No Assigned Workouts</Typography>
          <Typography variant="bodySm" color="secondary" style={styles.emptyDesc}>
            Check back later! Your trainer will assign your fitness plan here.
          </Typography>
        </View>
      ) : (
        <View>
          <Typography variant="h2" style={styles.planTitle}>{activePlan.name}</Typography>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
            {days.map(d => (
              <TouchableOpacity 
                key={d} 
                onPress={() => { setSelectedDay(d); setCompleted({}); }}
                style={[styles.dayButton, selectedDay === d && styles.dayActive]}
              >
                <Typography variant="bodySm" style={{ color: selectedDay === d ? theme.colors.background : theme.colors.text, fontWeight: '700' }}>
                  {d.slice(0, 3)}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.exercisesList}>
            {getExercises().length === 0 ? (
              <View style={styles.restDay}>
                <Award size={32} color={theme.colors.textMuted} />
                <Typography variant="bodySm" color="secondary">Rest Day / Active Cooldown</Typography>
              </View>
            ) : (
              getExercises().map((ex: any, idx: number) => {
                const isDone = !!completed[idx];
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.exRow, isDone && styles.exDone]} 
                    activeOpacity={0.8}
                    onPress={() => toggleComplete(idx)}
                  >
                    <View style={styles.exLeft}>
                      {isDone ? (
                        <CheckCircle2 size={22} color={theme.colors.success} />
                      ) : (
                        <Circle size={22} color={theme.colors.border} />
                      )}
                      <View style={styles.exInfo}>
                        <Typography variant="bodySm" style={[styles.exName, isDone && styles.textStrikethrough]}>
                          {ex.name}
                        </Typography>
                        <Typography variant="caption" color="secondary">
                          {ex.sets} sets × {ex.reps} reps {ex.weight ? `• ${ex.weight}kg` : ''}
                        </Typography>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {getExercises().length > 0 && (
            <TouchableOpacity style={styles.logButton} onPress={handleLogWorkout}>
              <Typography variant="bodySm" style={styles.logText}>Submit Today's Routine</Typography>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  streakCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, marginBottom: theme.spacing.md },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { color: theme.colors.text, marginTop: theme.spacing.md },
  emptyDesc: { textAlign: 'center', marginTop: theme.spacing.xs, paddingHorizontal: theme.spacing.xl },
  planTitle: { color: theme.colors.text, marginBottom: theme.spacing.md },
  daySelector: { flexDirection: 'row', marginBottom: theme.spacing.md },
  dayButton: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, marginRight: theme.spacing.xs, minWidth: 50, alignItems: 'center' },
  dayActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  exercisesList: { gap: theme.spacing.sm },
  restDay: { alignItems: 'center', paddingVertical: 40, gap: theme.spacing.xs },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  exDone: { borderColor: theme.colors.success, backgroundColor: 'rgba(46, 125, 50, 0.05)' },
  exLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 },
  exInfo: { flex: 1 },
  exName: { color: theme.colors.text, fontWeight: '700' },
  textStrikethrough: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  logButton: { backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.md, borderRadius: theme.radii.md, alignItems: 'center', marginTop: theme.spacing.lg },
  logText: { color: theme.colors.background, fontWeight: '700' },
});
