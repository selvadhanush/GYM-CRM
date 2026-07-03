import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { useToast } from '@/hooks/useToast';

export const Toast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { message, type, visible, hide } = useToast();
  const [slideAnim] = useState(() => new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: insets.top + 10,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, insets.top, slideAnim]);

  if (!message) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { border: theme.colors.success, bg: '#10b98115', icon: <CheckCircle2 color={theme.colors.success} size={18} /> };
      case 'error':
        return { border: theme.colors.error, bg: '#ef444415', icon: <AlertCircle color={theme.colors.error} size={18} /> };
      case 'warning':
        return { border: theme.colors.warning, bg: '#f59e0b15', icon: <AlertTriangle color={theme.colors.warning} size={18} /> };
      case 'info':
      default:
        return { border: theme.colors.info, bg: '#3b82f615', icon: <Info color={theme.colors.info} size={18} /> };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: theme.colors.card,
          borderColor: toastStyle.border,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        activeOpacity={0.9}
        onPress={hide}
      >
        <Animated.View style={[styles.glow, { backgroundColor: toastStyle.bg }]} />
        {toastStyle.icon}
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={hide} style={styles.closeBtn} activeOpacity={0.7}>
          <X color={theme.colors.textSecondary} size={16} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 9999,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 52,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
  },
  message: {
    ...theme.typography.bodySm,
    color: theme.colors.text,
    flex: 1,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    fontWeight: '500',
  },
  closeBtn: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
