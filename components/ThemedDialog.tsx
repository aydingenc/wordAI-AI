import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { DialogVariant, ResolvedDialog } from '@/context/DialogContext';

const DEFAULT_ICON: Record<DialogVariant, keyof typeof Feather.glyphMap> = {
  info: 'info',
  confirm: 'lock',
  destructive: 'alert-triangle',
};

/** hex (`#RRGGBB`) + a 0-1 alpha -> an `rgba()` string, so every color here
 * is derived from constants/colors.ts tokens instead of separately
 * hardcoded translucent literals. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ThemedDialog({
  visible,
  dialog,
  processing,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  dialog: ResolvedDialog | null;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();

  // `dialog` is only null before the first showDialog() call — `visible` is
  // never true in that state, but we still guard the render defensively.
  if (!dialog) return null;

  const isDestructive = dialog.variant === 'destructive';
  const iconName = dialog.icon ?? DEFAULT_ICON[dialog.variant];
  const showCancel = dialog.variant !== 'info';

  const tint = isDestructive ? colors.destructive : colors.primary;
  const badgeBg = withAlpha(tint, isDestructive ? 0.14 : 0.16);
  const badgeBorder = withAlpha(tint, isDestructive ? 0.36 : 0.35);
  const iconColor = isDestructive ? colors.destructive : colors.accent;
  // Exact gradient stops from the approved design: violet primary->glowViolet
  // for confirm/info, destructive->a darker red (no palette token for the
  // second stop, this literal is the one given in the approved spec).
  const confirmGradient: [string, string] = isDestructive
    ? [colors.destructive, '#DC2626']
    : [colors.primary, colors.glowViolet];

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: withAlpha(colors.background, 0.75) }]}
          onPress={processing ? undefined : onCancel}
        />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: withAlpha(colors.primary, 0.28) }]}>
          <View style={styles.glowWrap} pointerEvents="none">
            <Svg width={140} height={140}>
              <Defs>
                <RadialGradient id="dialogGlow" cx="70%" cy="20%" r="60%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={100} cy={20} r={100} fill="url(#dialogGlow)" />
            </Svg>
          </View>

          <View style={[styles.iconBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <Feather name={iconName} size={20} color={iconColor} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{dialog.title}</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>{dialog.message}</Text>

          <View style={styles.buttonRow}>
            {showCancel ? (
              <Pressable
                onPress={onCancel}
                disabled={processing}
                accessibilityRole="button"
                accessibilityLabel={dialog.cancelText}
                style={({ pressed }) => [
                  styles.button,
                  styles.ghostButton,
                  { borderColor: colors.border, opacity: pressed || processing ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.ghostButtonText, { color: colors.mutedForeground }]}>{dialog.cancelText}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onConfirm}
              disabled={processing}
              accessibilityRole="button"
              accessibilityLabel={dialog.confirmText}
              style={({ pressed }) => [styles.confirmPressable, { opacity: pressed || processing ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{dialog.confirmText}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  glowWrap: { position: 'absolute', top: 0, right: 0 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 8 },
  message: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  confirmPressable: { flex: 1 },
  button: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  ghostButton: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1 },
  ghostButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
