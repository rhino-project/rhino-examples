import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModelIndex, useModelUpdate, useModelDelete } from '@rhino-dev/rhino-react';
import type { Task, User, Project } from '../../types';
import { Pill } from '../../components/Pill';
import { useToast } from '../../components/Toaster';
import { colors, radii } from '../../theme';
import { fmtDate } from '../../lib/format';

const STATUSES: Task['status'][] = ['todo', 'in_progress', 'blocked', 'done'];

type TaskWithAssignee = Task & { assignee?: User };

export default function TasksScreen() {
  const toast = useToast();
  const [status, setStatus]     = useState('');
  const [priority, setPriority] = useState('');

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (status)   f.status   = status;
    if (priority) f.priority = priority;
    return f;
  }, [status, priority]);

  const tasks    = useModelIndex<TaskWithAssignee>('tasks', { filters, includes: ['assignee'], perPage: 200, sort: 'priority' });
  const projects = useModelIndex<Project>('projects', { perPage: 100 });
  const update   = useModelUpdate<Task>('tasks');
  const del      = useModelDelete<Task>('tasks');

  const projectById = new Map((projects.data?.data ?? []).map(p => [p.id, p]));
  const list        = tasks.data?.data ?? [];

  return (
    <ScrollView
      contentContainerStyle={s.wrap}
      refreshControl={<RefreshControl tintColor={colors.accent} refreshing={tasks.isFetching} onRefresh={() => tasks.refetch()} />}>
      <Text style={s.h1}>Tasks</Text>
      <Text style={s.sub}>?include=assignee · filter[status] · filter[priority]</Text>

      <FilterRow label="Status"  current={status}   options={['', 'todo', 'in_progress', 'blocked', 'done']} onChange={setStatus}   />
      <FilterRow label="Priority" current={priority} options={['', 'critical', 'high', 'medium', 'low']}     onChange={setPriority} />

      {tasks.isLoading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> :
        STATUSES.map(col => {
          const cards = list.filter(t => t.status === col);
          if (cards.length === 0) return null;
          return (
            <View key={col} style={{ marginTop: 18 }}>
              <View style={s.colHead}>
                <Pill value={col} />
                <Text style={s.colCount}>{cards.length}</Text>
              </View>
              <View style={{ gap: 8 }}>
                {cards.map(t => (
                  <View key={t.id} style={s.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                      <Text style={s.cardTitle}>{t.title}</Text>
                      <Pill value={t.priority} kind="priority" />
                    </View>
                    <Text style={s.cardSub}>{projectById.get(t.project_id ?? -1)?.title ?? `project #${t.project_id}`}</Text>
                    <View style={s.metaRow}>
                      <Text style={s.meta}>{t.assignee?.name ?? '— unassigned'}</Text>
                      <Text style={s.metaFaint}>due {fmtDate(t.due_date)}</Text>
                    </View>
                    <View style={s.actions}>
                      {col !== 'done' && (
                        <Pressable
                          onPress={async () => { await update.mutateAsync({ id: t.id, data: { status: 'done' } }); toast(`Marked "${t.title}" done`, 'ok'); }}
                          style={s.actionBtn}
                          hitSlop={8}>
                          <Ionicons name="checkmark-done" size={14} color={colors.fgMuted} />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={async () => { await del.mutateAsync(t.id); toast('Moved to trash', 'ok'); }}
                        style={s.actionBtn}
                        hitSlop={8}>
                        <Ionicons name="trash-outline" size={14} color={colors.fgMuted} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })
      }

      {!tasks.isLoading && list.length === 0 && (
        <View style={s.empty}><Text style={{ color: colors.fgMuted }}>No tasks match.</Text></View>
      )}
    </ScrollView>
  );
}

function FilterRow({ label, current, options, onChange }: { label: string; current: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={s.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {options.map(opt => (
          <Pressable key={opt || 'all'} onPress={() => onChange(opt)} style={[s.chip, current === opt && s.chipActive]}>
            <Text style={[s.chipText, current === opt && s.chipTextActive]}>{opt || 'all'}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { padding: 16, paddingBottom: 80 },
  h1:         { color: colors.fg, fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  sub:        { color: colors.fgMuted, fontSize: 12, marginBottom: 4, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  filterLabel:{ color: colors.fgFaint, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4, marginBottom: 6 },
  chipRow:    { gap: 6, paddingBottom: 4 },
  chip:       { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.bg1, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.bg3, borderColor: colors.accentDim },
  chipText:   { color: colors.fgMuted, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  colHead:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  colCount:   { color: colors.fgFaint, fontSize: 12 },
  card:       { backgroundColor: colors.bg1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 12, position: 'relative' },
  cardTitle:  { color: colors.fg, fontWeight: '600', fontSize: 13, flex: 1 },
  cardSub:    { color: colors.fgFaint, fontSize: 11, marginTop: 4 },
  metaRow:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  meta:       { color: colors.fgMuted, fontSize: 11 },
  metaFaint:  { color: colors.fgFaint, fontSize: 11 },
  actions:    { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 6 },
  actionBtn:  { padding: 6, borderRadius: 6, backgroundColor: colors.bg2 },
  empty:      { padding: 36, alignItems: 'center' },
});
