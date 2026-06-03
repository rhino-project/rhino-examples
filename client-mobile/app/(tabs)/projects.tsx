import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useModelIndex, useModelStore, useModelDelete } from '@rhino-dev/rhino-react';
import type { Project } from '../../types';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { useToast } from '../../components/Toaster';
import { colors, radii } from '../../theme';
import { fmtCurrency, fmtRelative } from '../../lib/format';

const STATUSES = ['', 'active', 'draft', 'done', 'archived'];

export default function ProjectsScreen() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);

  const filters = useMemo(() => (status ? { status } : {}), [status]);
  const q = useModelIndex<Project>('projects', { filters, search: search || undefined, sort: 'title', perPage: 50 });
  const store = useModelStore<Project>('projects');
  const del   = useModelDelete<Project>('projects');

  const list = q.data?.data ?? [];

  return (
    <>
      <ScrollView
        contentContainerStyle={s.wrap}
        refreshControl={<RefreshControl tintColor={colors.accent} refreshing={q.isFetching} onRefresh={() => q.refetch()} />}>
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.h1}>Projects</Text>
            <Text style={s.sub}>/api/{`{org}`}/projects</Text>
          </View>
          <Button variant="primary" onPress={() => setShowNew(true)} icon={<Ionicons name="add" size={16} color="#001714" />}>New</Button>
        </View>

        <View style={s.searchBox}>
          <Ionicons name="search" size={14} color={colors.fgMuted} style={{ marginRight: 6 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search title / description"
            placeholderTextColor={colors.fgFaint}
            style={s.search}
            autoCapitalize="none"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {STATUSES.map(st => (
            <Pressable key={st || 'all'} onPress={() => setStatus(st)} style={[s.chip, status === st && s.chipActive]}>
              <Text style={[s.chipText, status === st && s.chipTextActive]}>{st || 'all'}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {q.isLoading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> :
          list.length === 0 ? (
            <View style={s.empty}><Text style={{ color: colors.fgMuted }}>No projects match.</Text></View>
          ) : (
            <View style={{ gap: 10 }}>
              {list.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`} asChild>
                  <Pressable style={s.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={s.cardTitle}>{p.title}</Text>
                      <Pill value={p.status} />
                    </View>
                    {p.description && <Text style={s.cardDesc} numberOfLines={2}>{p.description}</Text>}
                    <View style={s.metaRow}>
                      <Text style={s.meta}>
                        {p.budget != null ? fmtCurrency(p.budget) : <Text style={{ fontStyle: 'italic' }}>hidden</Text>}
                      </Text>
                      <Text style={s.meta}>{p.starts_at?.slice(0, 10) ?? '—'} → {p.ends_at?.slice(0, 10) ?? '—'}</Text>
                      <Text style={s.metaFaint}>upd. {fmtRelative(p.updated_at)}</Text>
                    </View>
                    <Pressable
                      onPress={async () => { try { await del.mutateAsync(p.id); toast(`Deleted "${p.title}"`, 'ok'); } catch (e) { toast(`Delete failed: ${(e as Error).message}`, 'error'); } }}
                      style={s.deleteBtn}
                      hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={colors.fgMuted} />
                    </Pressable>
                  </Pressable>
                </Link>
              ))}
            </View>
          )
        }
      </ScrollView>

      <NewProjectModal
        visible={showNew}
        busy={store.isPending}
        onClose={() => setShowNew(false)}
        onCreate={async data => {
          try { const created = await store.mutateAsync(data); toast(`Created "${created.title}"`, 'ok'); setShowNew(false); }
          catch (e) { toast(`Create failed: ${(e as Error).message}`, 'error'); }
        }}
      />
    </>
  );
}

function NewProjectModal({ visible, onClose, onCreate, busy }: { visible: boolean; onClose: () => void; onCreate: (data: Partial<Project>) => Promise<void>; busy: boolean }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Project['status']>('draft');
  const [desc, setDesc] = useState('');
  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg1 }}>
        <View style={s.modalHead}>
          <Text style={s.modalTitle}>New project</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={20} color={colors.fgMuted} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Field label="Title">
            <TextInput value={title} onChangeText={setTitle} style={s.modalInput} placeholderTextColor={colors.fgFaint} placeholder="Q3 launch" />
          </Field>
          <Field label="Status">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {(['draft', 'active', 'done', 'archived'] as const).map(st => (
                <Pressable key={st} onPress={() => setStatus(st)} style={[s.chip, status === st && s.chipActive]}>
                  <Text style={[s.chipText, status === st && s.chipTextActive]}>{st}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Field>
          <Field label="Description">
            <TextInput value={desc} onChangeText={setDesc} multiline style={[s.modalInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholderTextColor={colors.fgFaint} />
          </Field>
          <Button variant="primary" busy={busy} onPress={() => onCreate({ title, status, description: desc })} icon={<Ionicons name="checkmark" size={14} color="#001714" />}>
            Create
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<View style={{ gap: 6 }}><Text style={{ color: colors.fgMuted, fontWeight: '600', fontSize: 12 }}>{label}</Text>{children}</View>);
}

const s = StyleSheet.create({
  wrap:       { padding: 16, paddingBottom: 80 },
  head:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
  h1:         { color: colors.fg, fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  sub:        { color: colors.fgMuted, fontSize: 12, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  searchBox:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, marginBottom: 10 },
  search:     { flex: 1, color: colors.fg, paddingVertical: 8, fontSize: 13 },
  chipRow:    { gap: 6, paddingBottom: 12 },
  chip:       { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.bg1, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.bg3, borderColor: colors.accentDim },
  chipText:   { color: colors.fgMuted, fontSize: 11, fontWeight: '600', textTransform: 'lowercase' },
  chipTextActive: { color: colors.accent },
  card:       { backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, position: 'relative' },
  cardTitle:  { color: colors.fg, fontSize: 14, fontWeight: '600', flex: 1 },
  cardDesc:   { color: colors.fgMuted, fontSize: 12, marginTop: 6 },
  metaRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  meta:       { color: colors.fgMuted, fontSize: 11 },
  metaFaint:  { color: colors.fgFaint, fontSize: 11, marginLeft: 'auto' },
  deleteBtn:  { position: 'absolute', top: 10, right: 10, padding: 6, borderRadius: 6, backgroundColor: colors.bg2 },
  empty:      { padding: 36, alignItems: 'center' },
  modalHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.fg, fontSize: 16, fontWeight: '600' },
  modalInput: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, color: colors.fg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
});
