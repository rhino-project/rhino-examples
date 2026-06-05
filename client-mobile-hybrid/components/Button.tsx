import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle, View } from 'react-native';
import { colors, radii } from '../theme';

type Variant = 'primary' | 'ghost' | 'danger' | 'default';

export function Button({ children, onPress, variant = 'default', busy, disabled, style, icon }: {
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  busy?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}) {
  const palette = palettes[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: palette.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {busy ? <ActivityIndicator size="small" color={palette.fg} /> : (
        <View style={s.row}>
          {icon}
          {children != null && <Text style={[s.text, { color: palette.fg }]}>{children}</Text>}
        </View>
      )}
    </Pressable>
  );
}

const palettes: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: colors.accent,   fg: '#001714' },
  default: { bg: colors.bg3,      fg: colors.fg },
  ghost:   { bg: 'transparent',   fg: colors.fgMuted },
  danger:  { bg: colors.danger,   fg: '#2a0000' },
};

const s = StyleSheet.create({
  btn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radii.sm, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontWeight: '600', fontSize: 13 },
});
