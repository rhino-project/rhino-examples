// Generic, face-agnostic workspace. Lists the active face's model via
// useModelIndex(face.model) with tenancy:'subdomain' (the org is carried by the
// Host header set in GroupContext, so the request URL is /api/{model}). Banner +
// accent reflect the active face.
import { ScrollView, View, Text, StyleSheet, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useModelIndex, useAuth } from '@rhino-dev/rhino-react';
import { useGroup } from '../src/groups/GroupContext';
import { Card, CardHeader, CardEmpty } from '../components/Card';
import { Pill } from '../components/Pill';
import { colors, radii } from '../theme';

interface Row {
  id: number | string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
}

export default function WorkspaceScreen() {
  const { active, clearGroup } = useGroup();
  const { logout } = useAuth();
  const face = active?.face;

  // Hooks must run unconditionally; pass a harmless model when no face (gate
  // redirects away in that case anyway).
  const index = useModelIndex<Row>(face?.model ?? 'projects', { perPage: 100 });
  const rows = index.data?.data ?? [];

  if (!active || !face) return null;
  const accent = face.accent;

  async function leave() {
    await logout();
    clearGroup();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <ScrollView
        contentContainerStyle={s.wrap}
        refreshControl={<RefreshControl tintColor={accent} refreshing={index.isFetching} onRefresh={() => index.refetch()} />}>

        {/* Face banner */}
        <View style={[s.banner, { borderColor: accent }]}>
          <View style={[s.accentBar, { backgroundColor: accent }]} />
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerLabel, { color: accent }]}>{face.label}</Text>
            <Text style={s.bannerMeta}>
              {active.org && face.tenant ? `org ${active.org} · ` : ''}{active.host}
            </Text>
          </View>
          <Pressable onPress={leave} style={s.leaveBtn}>
            <Ionicons name="log-out-outline" size={16} color={colors.fgMuted} />
            <Text style={s.leaveText}>Leave</Text>
          </Pressable>
        </View>

        <Text style={s.h1}>{face.model}</Text>
        <Text style={s.sub}>GET /api/{face.model} · Host: {active.host}</Text>

        <Card style={{ marginTop: 14 }}>
          <CardHeader title={`${rows.length} item${rows.length === 1 ? '' : 's'}`} />
          {index.isLoading ? (
            <View style={{ padding: 28 }}><ActivityIndicator color={accent} /></View>
          ) : index.isError ? (
            <CardEmpty>Failed to load. Check the backend is on :8002 and the Host resolves.</CardEmpty>
          ) : rows.length === 0 ? (
            <CardEmpty>No {face.model} yet.</CardEmpty>
          ) : (
            rows.map((r) => (
              <View key={r.id} style={s.row}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.rowTitle}>{r.title ?? r.name ?? `#${r.id}`}</Text>
                  {r.description ? <Text numberOfLines={1} style={s.rowSub}>{r.description}</Text> : null}
                </View>
                {r.status ? <Pill value={r.status} /> : null}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap:       { padding: 16, paddingBottom: 80 },
  banner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, padding: 16, overflow: 'hidden', gap: 8 },
  accentBar:  { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.8 },
  bannerLabel:{ fontSize: 16, fontWeight: '700' },
  bannerMeta: { color: colors.fgFaint, fontSize: 11, marginTop: 3, fontFamily: 'monospace' },
  leaveBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 8 },
  leaveText:  { color: colors.fgMuted, fontSize: 12, fontWeight: '600' },
  h1:         { color: colors.fg, fontSize: 24, fontWeight: '700', letterSpacing: -0.4, marginTop: 18 },
  sub:        { color: colors.fgFaint, fontSize: 11, marginTop: 4, fontFamily: 'monospace' },
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  rowTitle:   { color: colors.fg, fontWeight: '600', fontSize: 13 },
  rowSub:     { color: colors.fgFaint, fontSize: 11, marginTop: 2 },
});
