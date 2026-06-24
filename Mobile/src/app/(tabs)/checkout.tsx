import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { memberService } from '@/services/member';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '@/theme';

export default function CheckoutScreen() {
  const router = useRouter();
  const { planId, planName, planPrice, planDuration, isFitPrime } = useLocalSearchParams<{
    planId: string;
    planName: string;
    planPrice: string;
    planDuration: string;
    isFitPrime?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const price = Number(planPrice) || 0;
  const gst = price * 0.18;
  const total = price + gst;

  const handlePayment = async () => {
    if (!planId) return;
    setLoading(true);

    try {
      // 1. Create Order
      const order = await memberService.purchasePlanOrder(planId);

      // 2. Simulate Razorpay UI Processing Overlay
      setLoading(false);
      setProcessing(true);
      
      // Simulate user interacting with Razorpay dummy interface for 2.5s
      await new Promise(resolve => setTimeout(resolve, 2500));

      // 3. Verify Payment
      await memberService.verifyPlanPurchase({
        razorpay_order_id: order.id,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature',
        planId: planId,
      });

      setProcessing(false);
      setSuccess(true);
      
      // 4. Redirect after showing success for 2 seconds
      setTimeout(() => {
        setSuccess(false);
        router.back();
      }, 2000);
      
    } catch (error: any) {
      setLoading(false);
      setProcessing(false);
      Alert.alert('Payment Failed', error?.message || 'Something went wrong during checkout.');
    }
  };

  if (!planId) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>No plan selected for checkout.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Processing Modal (Simulating Razorpay) */}
      <Modal visible={processing || success} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {success ? (
              <>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
                <Text style={styles.modalTitle}>Payment Successful!</Text>
                <Text style={styles.modalText}>Your plan has been activated.</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.modalTitle}>Processing Payment</Text>
                <Text style={styles.modalText}>Please do not close the app or press back.</Text>
                <View style={styles.razorpayBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#FFF" />
                  <Text style={styles.razorpayText}>Secured by Razorpay</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Order Summary</Text>

        <View style={styles.receiptCard}>
          <LinearGradient
            colors={[COLORS.backgroundCard, 'rgba(255,255,255,0.02)']}
            style={styles.receiptGradient}
          >
            <View style={styles.receiptHeader}>
              <Ionicons name="star" size={20} color={COLORS.warning} />
              <Text style={styles.planName}>{planName}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{isFitPrime === 'true' ? 'Sessions' : 'Duration'}</Text>
              <Text style={styles.receiptValue}>{planDuration} {isFitPrime === 'true' ? 'Sessions' : 'Hours'}</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Plan Amount</Text>
              <Text style={styles.receiptValue}>₹{price.toFixed(2)}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>GST (18%)</Text>
              <Text style={styles.receiptValue}>₹{gst.toFixed(2)}</Text>
            </View>

            <View style={styles.receiptDividerDashed} />

            <View style={styles.receiptRowTotal}>
              <Text style={styles.receiptTotalLabel}>Total Amount</Text>
              <Text style={styles.receiptTotalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={16} color={COLORS.success} />
          <Text style={styles.securityText}>Guaranteed Safe & Secure Checkout</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payGradient}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <Text style={styles.payButtonText}>Pay ₹{total.toFixed(2)}</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.textPrimary} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  headerBack: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    ...FONTS.semibold,
    marginBottom: SPACING.md,
  },
  receiptCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  receiptGradient: {
    padding: SPACING.xl,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  planName: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  receiptLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
  },
  receiptValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    ...FONTS.medium,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  receiptDividerDashed: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderStyle: 'dashed',
    marginVertical: SPACING.md,
  },
  receiptRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  receiptTotalLabel: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    ...FONTS.semibold,
  },
  receiptTotalValue: {
    fontSize: FONTS.sizes.xxl,
    color: COLORS.primary,
    ...FONTS.bold,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
  },
  securityText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.success,
    ...FONTS.medium,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: 110,
    backgroundColor: COLORS.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  payGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 16,
  },
  payButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    ...FONTS.bold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.xl,
  },
  errorText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    ...FONTS.medium,
  },
  backButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
  },
  backText: {
    color: COLORS.textPrimary,
    ...FONTS.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  modalText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  razorpayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#3399CC',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  razorpayText: {
    color: '#FFF',
    fontSize: FONTS.sizes.xs,
    ...FONTS.bold,
  },
});
