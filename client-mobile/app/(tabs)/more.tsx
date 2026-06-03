import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@rhino-dev/rhino-react';
import { colors, radii } from '../../theme';

const ROWS = [
  { title: 'Labels',  href: '/labels',  desc: 'Org-scoped tagging',                      icon: 'pricetag-outline' },
  { title: 'Members', href: '/members', desc: 'Users + invitations',                     icon: 'people-outline' },
  { title: 'Trash',   href: '/trash',   desc: 'Soft-deleted records, restore or purge',  icon: 'trash-outline' },
] as const;

export default function MoreScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const orgSlug = typeof window === 'undefined' ? '' : '';
  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <View style={s.head}>
        <Text style={s.h1}>More</Text>
        <Text style={s.sub}>Admin tools + workspace settings</Text>
      </View>

      <View style={{ gap: 10 }}>
        {ROWS.map(r => (
          <Link key={r.href} href={r.href as any} asChild>
            <Pressable style={s.row}>
              <View style={s.icon}><Ionicons name={r.icon as any} size={20} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{r.title}</Text>
                <Text style={s.rowDesc}>{r.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.fgFaint} />
            </Pressable>
          </Link>
        ))}
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>SESSION</Text>
        <Pressable
          style={[s.row, { borderColor: colors.danger + '55' }]}
          onPress={async () => { await logout(); router.replace('/(auth)/login'); }}>
          <View style={[s.icon, { backgroundColor: '#250e0e' }]}><Ionicons name="log-out-outline" size={20} color={colors.danger} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowTitle, { color: colors.danger }]}>Sign out</Text>
            <Text style={s.rowDesc}>Clears the token from local storage</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:       { padding: 16, paddingBottom: 80 },
  head:       { marginBottom: 16 },
  h1:         { color: colors.fg, fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  sub:        { color: colors.fgMuted, fontSize: 13, marginTop: 4 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  icon:       { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' },
  rowTitle:   { color: colors.fg, fontWeight: '600', fontSize: 14 },
  rowDesc:    { color: colors.fgFaint, fontSize: 12, marginTop: 2 },
  section:    { marginTop: 20, gap: 8 },
  sectionLabel: { color: colors.fgFaint, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, marginLeft: 4 },
});
