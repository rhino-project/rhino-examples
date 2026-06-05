import { View, Text, StyleSheet } from 'react-native';
import { colors, priorityColor, statusColor } from '../theme';

type Variant = 'status' | 'priority';

export function Pill({ value, kind = 'status' }: { value: string; kind?: Variant }) {
  const map = kind === 'priority' ? priorityColor : statusColor;
  const tones = map[value] ?? { fg: colors.fgMuted, bg: colors.bg3 };
  return (
    <View style={[s.pill, { backgroundColor: tones.bg }]}>
      {kind === 'status' && <View style={[s.dot, { backgroundColor: tones.fg }]} />}
      <Text style={[s.text, { color: tones.fg }]}>{value.replace('_', ' ')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, gap: 5, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
});
