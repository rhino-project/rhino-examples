import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { colors, radii } from '../theme';

export function Card({ children, style, ...rest }: ViewProps) {
  return <View style={[s.card, style]} {...rest}>{children}</View>;
}

export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={s.header}>
      <Text style={s.title}>{title}</Text>
      {action}
    </View>
  );
}

export function CardEmpty({ children }: { children: React.ReactNode }) {
  return <View style={s.empty}><Text style={{ color: colors.fgMuted }}>{children}</Text></View>;
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.bg1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 14, fontWeight: '600', color: colors.fg },
  empty: { padding: 28, alignItems: 'center' },
});
