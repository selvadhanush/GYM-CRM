import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { memberService } from '@/services/member';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '@/theme';
import type { Member, GymClass, Plan } from '@/types';

export default function PackagesScreen() {
  const [member, setMember] = useState<Member | null>(null);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [fitPrimePlans, setFitPrimePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingAmount, setPayingAmount] = useState<number | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const m = await memberService.getMyPlan().catch(() => null);
      const c = await memberService.getClasses().catch(() => []);
      const p = await memberService.getFitPrimePlans().catch(() => []);
      setMember(m); setClasses(c); setFitPrimePlans(p);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handlePayment = async (amount: number) => {
    setPayingAmount(amount);
    try {
      const order = await memberService.createPaymentOrder(amount);
      const res = await memberService.verifyPayment({
        razorpay_order_id: order.id,
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_signature: 'mock_signature',
        amount_paid: amount,
      });
      Alert.alert('Success', `₹${res.amountPaid} paid. Remaining: ₹${res.remainingDue}`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Payment failed');
    } finally { setPayingAmount(null); }
  };

  const handleBookClass = async (classId: string) => {
    try {
      const res = await memberService.bookClass(classId);
      Alert.alert('Booked!', res.message); fetchData();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleCancelBooking = async (classId: string) => {
    try {
      const res = await memberService.cancelBooking(classId);
      Alert.alert('Cancelled', res.message); fetchData();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleCancelPlan = () => {
    Alert.alert('Cancel Plan', 'Are you sure you want to cancel your current plan?', [
      { text: 'Keep It', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: async () => {
          try {
            await memberService.cancelPlan();
            Alert.alert('Cancelled', 'Your plan has been cancelled.'); fetchData();
          } catch (e: any) { Alert.alert('Error', e.message); }
        }
      }
    ]);
  };

  const balanceDue = member ? (member.planPrice || 0) - (member.paidAmount || 0) : 0;

  if (loading) return (
    <View style={styles.base}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  );

  return (
    <ScrollView
      style={styles.base}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Plans & Dues</Text>

      {/* Dues Section */}
      {member && balanceDue > 0 && (
        <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.02)']} style={styles.dueCard}>
          <View style={styles.dueHeader}>
            <View style={styles.dueIconBg}>
              <Ionicons name="wallet" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.dueTexts}>
              <Text style={styles.dueTitle}>Payment Due</Text>
              <Text style={styles.dueSub}>Clear dues to keep access active</Text>
            </View>
          </View>
          
          <View style={styles.dueStatsRow}>
            <View>
              <Text style={styles.dueStatLbl}>Total Price</Text>
              <Text style={styles.dueStatVal}>₹{member.planPrice}</Text>
            </View>
            <View>
              <Text style={styles.dueStatLbl}>Paid</Text>
              <Text style={[styles.dueStatVal, { color: COLORS.success }]}>₹{member.paidAmount}</Text>
            </View>
            <View style={styles.dueTotWrap}>
              <Text style={styles.dueTotLbl}>Balance</Text>
              <Text style={styles.dueTotVal}>₹{balanceDue}</Text>
            </View>
          </View>

          <View style={styles.dueBtns}>
            {balanceDue >= 500 && (
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={() => handlePayment(Math.min(500, balanceDue))}
                disabled={payingAmount !== null}
              >
                {payingAmount === 500 ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.btnOutlineText}>Pay ₹500</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.btnSolid}
              onPress={() => handlePayment(balanceDue)}
              disabled={payingAmount !== null}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.btnSolidGrad}>
                {payingAmount === balanceDue ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSolidText}>Pay Full ₹{balanceDue}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {/* Active Plan / Cleared Status */}
      {member && balanceDue <= 0 && member.planId && (
        <View style={styles.statusBanner}>
          <View style={styles.statusLeft}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            <Text style={styles.statusText}>All dues cleared</Text>
          </View>
          <TouchableOpacity onPress={handleCancelPlan} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel Plan</Text>
          </TouchableOpacity>
        </View>
      )}
      {(!member || !member.planId) && (
        <View style={[styles.statusBanner, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }]}>
          <Ionicons name="warning" size={22} color={COLORS.danger} />
          <Text style={[styles.statusText, { color: COLORS.danger }]}>No active plan. Buy a plan below.</Text>
        </View>
      )}

      {/* FitPrime Plans */}
      {fitPrimePlans.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FitPrime Global Plans</Text>
          <Text style={styles.sectionSub}>Access any partner gym</Text>
          {fitPrimePlans.map(p => (
            <LinearGradient key={p._id || p.id} colors={['rgba(255,122,0,0.1)', 'rgba(255,122,0,0.02)']} style={styles.planCard}>
              <View style={styles.planTop}>
                <View style={styles.planTag}><Text style={styles.planTagTxt}>GLOBAL ACCESS</Text></View>
              </View>
              <Text style={styles.planName}>{p.name}</Text>
              <View style={styles.planMeta}>
                <View style={styles.planMetaItem}>
                  <Ionicons name="time" size={16} color={COLORS.primary} />
                  <Text style={styles.planMetaTxt}>{p.sessions} sessions</Text>
                </View>
                <View style={styles.planMetaItem}>
                  <Ionicons name="cash" size={16} color={COLORS.success} />
                  <Text style={[styles.planMetaTxt, { color: COLORS.success, ...FONTS.bold }]}>₹{p.price}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => router.push({ pathname: '/(tabs)/checkout', params: { planId: p._id||p.id, planName: p.name, planPrice: String(p.price), planDuration: String(p.sessions), isFitPrime: 'true' } })}
              >
                <Ionicons name="cart" size={18} color="#fff" />
                <Text style={styles.buyBtnTxt}>Buy Plan</Text>
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </View>
      )}

      {/* Upcoming Classes */}
      {classes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Classes</Text>
          {classes.map(c => (
            <View key={c._id || c.id} style={styles.classCard}>
              <View style={styles.classTop}>
                <View style={styles.classTag}><Text style={styles.classTagTxt}>{c.type}</Text></View>
                <Text style={styles.classSeats}>{c.seatsAvailable}/{c.maxSeats} seats</Text>
              </View>
              <Text style={styles.className}>{c.name}</Text>
              {c.trainerName && (
                <View style={styles.classTrainer}>
                  <Ionicons name="person" size={14} color={COLORS.textMuted} />
                  <Text style={styles.classTrainerTxt}>{c.trainerName}</Text>
                </View>
              )}
              <View style={styles.classTimeRow}>
                <Ionicons name="calendar" size={14} color={COLORS.secondary} />
                <Text style={styles.classTimeTxt}>{new Date(c.scheduleDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                <Ionicons name="time" size={14} color={COLORS.secondary} style={{ marginLeft: 8 }} />
                <Text style={styles.classTimeTxt}>{c.startTime} - {c.endTime}</Text>
              </View>
              {c.description ? <Text style={styles.classDesc}>{c.description}</Text> : null}
              <TouchableOpacity
                style={[styles.bookBtn, c.isBooked && styles.bookBtnCancel]}
                onPress={() => c.isBooked ? handleCancelBooking(c._id||c.id) : handleBookClass(c._id||c.id)}
              >
                <Ionicons name={c.isBooked ? 'close-circle' : 'add-circle'} size={18} color={c.isBooked ? COLORS.danger : COLORS.primary} />
                <Text style={[styles.bookBtnTxt, c.isBooked && { color: COLORS.danger }]}>{c.isBooked ? 'Cancel Booking' : 'Book Class'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {classes.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧘‍♀️</Text>
          <Text style={styles.emptyTitle}>No Classes</Text>
          <Text style={styles.emptySub}>Check back later for upcoming sessions</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: 110 },
  pageTitle: { fontSize: FONTS.sizes.title, color: '#000000', ...FONTS.bold, letterSpacing: -0.5, marginBottom: SPACING.lg },

  dueCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  dueHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  dueIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.15)', justifyContent: 'center', alignItems: 'center' },
  dueTexts: { flex: 1 },
  dueTitle: { color: '#000000', fontSize: FONTS.sizes.lg, ...FONTS.bold },
  dueSub: { color: '#444444', fontSize: FONTS.sizes.sm, ...FONTS.regular, marginTop: 2 },
  dueStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.lg },
  dueStatLbl: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.medium, marginBottom: 4 },
  dueStatVal: { color: '#000000', fontSize: FONTS.sizes.md, ...FONTS.bold },
  dueTotWrap: { alignItems: 'flex-end' },
  dueTotLbl: { color: COLORS.warning, fontSize: FONTS.sizes.sm, ...FONTS.bold, marginBottom: 2 },
  dueTotVal: { color: COLORS.warning, fontSize: FONTS.sizes.xl, ...FONTS.black },
  dueBtns: { flexDirection: 'row', gap: SPACING.sm },
  btnOutline: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.primary },
  btnOutlineText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, ...FONTS.bold },
  btnSolid: { flex: 1.5, height: 48, borderRadius: RADIUS.lg, overflow: 'hidden' },
  btnSolidGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnSolidText: { color: '#fff', fontSize: FONTS.sizes.sm, ...FONTS.bold },

  statusBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.1)', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', marginBottom: SPACING.lg },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  statusText: { color: COLORS.success, fontSize: FONTS.sizes.md, ...FONTS.semibold },
  cancelBtn: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  cancelText: { color: COLORS.danger, fontSize: FONTS.sizes.xs, ...FONTS.bold },

  section: { marginBottom: SPACING.xl },
  sectionTitle: { color: '#000000', fontSize: FONTS.sizes.lg, ...FONTS.bold, marginBottom: 2 },
  sectionSub: { color: '#666666', fontSize: FONTS.sizes.sm, ...FONTS.regular, marginBottom: SPACING.md },

  planCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,122,0,0.3)' },
  planTop: { marginBottom: SPACING.md },
  planTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,122,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  planTagTxt: { color: COLORS.primary, fontSize: 10, ...FONTS.bold, letterSpacing: 1 },
  planName: { color: '#000000', fontSize: FONTS.sizes.xxl, ...FONTS.bold, letterSpacing: -0.5, marginBottom: SPACING.md },
  planMeta: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.lg },
  planMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planMetaTxt: { color: '#444444', fontSize: FONTS.sizes.md, ...FONTS.medium },
  buyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.lg },
  buyBtnTxt: { color: '#fff', fontSize: FONTS.sizes.md, ...FONTS.bold },

  classCard: { backgroundColor: '#F8F9FA', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#E5E7EB' },
  classTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  classTag: { backgroundColor: 'rgba(0,212,170,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  classTagTxt: { color: COLORS.secondary, fontSize: 10, ...FONTS.bold, textTransform: 'uppercase', letterSpacing: 1 },
  classSeats: { color: '#666666', fontSize: FONTS.sizes.xs, ...FONTS.medium },
  className: { color: '#000000', fontSize: FONTS.sizes.lg, ...FONTS.bold, marginBottom: SPACING.xs },
  classTrainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm },
  classTrainerTxt: { color: '#444444', fontSize: FONTS.sizes.sm, ...FONTS.regular },
  classTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm },
  classTimeTxt: { color: '#000000', fontSize: FONTS.sizes.sm, ...FONTS.medium },
  classDesc: { color: '#666666', fontSize: FONTS.sizes.sm, ...FONTS.regular, marginBottom: SPACING.md, lineHeight: 20 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,122,0,0.1)', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)' },
  bookBtnCancel: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  bookBtnTxt: { color: COLORS.primary, fontSize: FONTS.sizes.sm, ...FONTS.bold },

  empty: { alignItems: 'center', padding: SPACING.xxl, backgroundColor: '#F8F9FA', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: '#E5E7EB' },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.md },
  emptyTitle: { color: '#000000', fontSize: FONTS.sizes.lg, ...FONTS.semibold },
  emptySub: { color: '#666666', fontSize: FONTS.sizes.sm, marginTop: 4, textAlign: 'center' },
});
