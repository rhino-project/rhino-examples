// Entry screen — the group/"face" picker. Lists GROUPS as cards (label + accent).
// Tenant faces show an editable org-slug input (defaulting to the seeded demo
// org). On select -> selectGroup(face, org) wires the API target and the gate
// routes to that face's Login.
import { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GROUPS, useGroup } from '../src/groups/GroupContext';
import { resolveHost, type GroupFace } from '../src/groups/registry';
import { colors, radii } from '../theme';

export default function GroupSelect() {
  const { selectGroup } = useGroup();
  // Per-face org-slug inputs, seeded with each tenant face's demo org.
  const [orgs, setOrgs] = useState<Record<string, string>>(() =>
    Object.fromEntries(GROUPS.filter((g) => g.tenant).map((g) => [g.key, g.demo.org ?? '']))
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.brand}>
          <View style={s.mark}><Text style={s.markText}>R</Text></View>
          <Text style={s.brandName}>Rhino <Text style={{ color: colors.fgMuted, fontWeight: '500' }}>/multi-face</Text></Text>
        </View>

        <Text style={s.title}>Choose a workspace</Text>
        <Text style={s.sub}>One app, three backend route groups. Pick which one to sign into.</Text>

        <View style={{ gap: 12 }}>
          {GROUPS.map((face) => (
            <FaceCard
              key={face.key}
              face={face}
              org={orgs[face.key]}
              onChangeOrg={(v) => setOrgs((m) => ({ ...m, [face.key]: v }))}
              onSelect={() => selectGroup(face, face.tenant ? orgs[face.key]?.trim() || undefined : undefined)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FaceCard({
  face,
  org,
  onChangeOrg,
  onSelect,
}: {
  face: GroupFace;
  org: string;
  onChangeOrg: (v: string) => void;
  onSelect: () => void;
}) {
  const host = resolveHost(face, face.tenant ? org?.trim() || undefined : undefined);
  return (
    <View style={[s.card, { borderColor: face.accent }]}>
      <View style={[s.accentBar, { backgroundColor: face.accent }]} />
      <View style={s.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={[s.faceLabel, { color: face.accent }]}>{face.label}</Text>
          <Text style={s.faceMeta}>{face.tenant ? 'Organization-scoped' : 'Personal · org-less'} · model {face.model}</Text>
        </View>
      </View>

      {face.tenant && (
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={s.fieldLabel}>Organization slug</Text>
          <TextInput
            value={org}
            onChangeText={onChangeOrg}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={face.demo.org}
            placeholderTextColor={colors.fgFaint}
            style={s.input}
          />
        </View>
      )}

      <Text style={s.host}>Host → {host}</Text>

      <Pressable onPress={onSelect} style={({ pressed }) => [s.btn, { backgroundColor: face.accent, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={s.btnText}>Enter {face.label}</Text>
        <Ionicons name="arrow-forward" size={15} color="#001714" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:      { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 20 },
  mark:      { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  markText:  { color: '#001714', fontWeight: '800', fontSize: 15 },
  brandName: { color: colors.fg, fontSize: 18, fontWeight: '700' },
  title:     { color: colors.fg, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  sub:       { color: colors.fgMuted, fontSize: 13, textAlign: 'center', marginBottom: 22 },
  card:      { backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, padding: 16, overflow: 'hidden', gap: 10 },
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.8 },
  cardHead:  { flexDirection: 'row', alignItems: 'center' },
  faceLabel: { fontSize: 16, fontWeight: '700' },
  faceMeta:  { color: colors.fgFaint, fontSize: 11, marginTop: 2 },
  fieldLabel:{ color: colors.fgMuted, fontWeight: '600', fontSize: 12 },
  input:     { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, color: colors.fg, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  host:      { color: colors.fgFaint, fontSize: 11, fontFamily: 'monospace' },
  btn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radii.sm },
  btnText:   { color: '#001714', fontWeight: '700', fontSize: 14 },
});
