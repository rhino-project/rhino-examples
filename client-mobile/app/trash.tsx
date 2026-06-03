import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useModelTrashed, useModelRestore, useModelForceDelete } from '@rhino-dev/rhino-react';
import type { Project, Task, Label } from '../types';
import { Card, CardEmpty } from '../components/Card';
import { useToast } from '../components/Toaster';
import { colors, radii } from '../theme';
import { fmtRelative } from '../lib/format';

const TABS = [
  { slug: 'projects' as const, label: 'Projects' },
  { slug: 'tasks' as const,    label: 'Tasks' },
  { slug: 'labels' as const,   label: 'Labels' },
];

type Slug = (typeof TABS)[number]['slug'];

export default function TrashScreen() {
  const [active, setActive] = useState<Slug>('projects');
  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: 'Trash' }} />
      <Text style={s.sub}>Soft-deleted records — restore or permanently delete.</Text>
      <View style={s.tabRow}>
        {TABS.map(t => (
          <Pressable key={t.slug} onPress={() => setActive(t.slug)} style={[s.tabBtn, active === t.slug && s.tabActive]}>
            <Text style={[s.tabText, active === t.slug && { color: '#001714' }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {active === 'projects' && <List<Project> slug="projects" fields={['title', 'status']} />}
      {active === 'tasks'    && <List<Task>    slug="tasks"    fields={['title', 'status', 'priority']} />}
      {active === 'labels'   && <List<Label>   slug="labels"   fields={['name', 'color']} />}
    </ScrollView>
  );
}

function List<T extends { id: number; deleted_at?: string | null }>({ slug, fields }: { slug: Slug; fields: (keyof T)[] }) {
  const toast   = useToast();
  const trashed = useModelTrashed<T>(slug);
  const restore = useModelRestore<T>(slug);
  const fdel    = useModelForceDelete<T>(slug);
  const list    = trashed.data?.data ?? [];

  if (trashed.isLoading) return <ActivityIndicator color={colors.accent} style={{ padding: 24 }} />;
  if (list.length === 0) return (
    <Card>
      <CardEmpty>Trash is empty for {slug}.</CardEmpty>
    </Card>
  );
  return (
    <View style={{ gap: 8 }}>
      {list.map(item => (
        <View key={item.id} style={s.card}>
          {fields.map(f => (
            <Text key={String(f)} style={s.fieldText}>
              <Text style={s.fieldLabel}>{String(f)}:</Text> {String((item as any)[f] ?? '—')}
            </Text>
          ))}
          <Text style={s.metaFaint}>Deleted {fmtRelative(item.deleted_at)}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable
              style={[s.btn, { backgroundColor: colors.bg3 }]}
              onPress={async () => { await restore.mutateAsync(item.id); toast('Restored', 'ok'); }}>
              <Ionicons name="refresh" size={12} color={colors.fg} />
              <Text style={{ color: colors.fg, fontSize: 12, fontWeight: '600' }}>Restore</Text>
            </Pressable>
            <Pressable
              style={[s.btn, { backgroundColor: colors.danger }]}
              onPress={() => Alert.alert('Permanently delete?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => { await fdel.mutateAsync(item.id); toast('Permanently deleted', 'ok'); } },
              ])}>
              <Ionicons name="trash-bin-outline" size={12} color="#2a0000" />
              <Text style={{ color: '#2a0000', fontSize: 12, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { padding: 16, paddingBottom: 80 },
  sub:        { color: colors.fgMuted, fontSize: 13, marginBottom: 14 },
  tabRow:     { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tabBtn:     { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.bg2, borderRadius: radii.sm },
  tabActive:  { backgroundColor: colors.accent },
  tabText:    { color: colors.fgMuted, fontWeight: '600', fontSize: 12 },
  card:       { backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, opacity: 0.85 },
  fieldText:  { color: colors.fg, fontSize: 13, marginBottom: 2 },
  fieldLabel: { color: colors.fgMuted, fontWeight: '600' },
  metaFaint:  { color: colors.fgFaint, fontSize: 11, marginTop: 6 },
  btn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.sm },
});
