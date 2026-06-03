import { ScrollView, View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useModelIndex, useModelTrashed } from '@rhino-dev/rhino-react';
import type { Project, Task, Label, User } from '../../types';
import { Card, CardHeader } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { colors, radii } from '../../theme';
import { fmtRelative } from '../../lib/format';

export default function DashboardScreen() {
  const projects  = useModelIndex<Project>('projects', { perPage: 100 });
  const tasks     = useModelIndex<Task & { assignee?: User }>('tasks', { perPage: 100, includes: ['assignee'] });
  const labels    = useModelIndex<Label>('labels', { perPage: 100 });
  const trashProj = useModelTrashed<Project>('projects');

  const projectList = projects.data?.data ?? [];
  const taskList    = tasks.data?.data    ?? [];
  const labelList   = labels.data?.data   ?? [];
  const trashCount  = trashProj.data?.data?.length ?? 0;

  const activeProjects   = projectList.filter(p => p.status === 'active').length;
  const inProgressTasks  = taskList.filter(t => t.status === 'in_progress').length;
  const overdueTasks     = taskList.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
  const refreshing       = projects.isFetching || tasks.isFetching;

  return (
    <ScrollView
      contentContainerStyle={s.wrap}
      refreshControl={<RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={() => { projects.refetch(); tasks.refetch(); labels.refetch(); trashProj.refetch(); }} />}>

      <Text style={s.h1}>Overview</Text>
      <Text style={s.sub}>Your workspace activity at a glance</Text>

      <View style={s.statsGrid}>
        <Stat label="Active projects" value={activeProjects} hint={`${projectList.length} total`} />
        <Stat label="In progress" value={inProgressTasks} hint={`${taskList.length} tasks`} />
        <Stat label="Overdue" value={overdueTasks} hint="past due" tone="warn" />
        <Stat label="Labels" value={labelList.length} hint="across resources" />
        <Stat label="In trash" value={trashCount} hint="restorable" />
      </View>

      <Card style={{ marginTop: 16 }}>
        <CardHeader title="Recent projects" action={
          <Link href="/projects" style={s.linkBtn}>View all →</Link>
        } />
        {projects.isLoading ? <View style={{ padding: 24 }}><ActivityIndicator color={colors.accent} /></View> :
          projectList.length === 0 ? (
            <View style={s.empty}><Text style={{ color: colors.fgMuted }}>No projects yet.</Text></View>
          ) : projectList.slice(0, 5).map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} asChild>
              <View style={s.row}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.rowTitle}>{p.title}</Text>
                  {p.description && <Text numberOfLines={1} style={s.rowSub}>{p.description}</Text>}
                </View>
                <Pill value={p.status} />
              </View>
            </Link>
          ))
        }
      </Card>

      <Card style={{ marginTop: 14 }}>
        <CardHeader title="Hot tasks" action={<Link href="/tasks" style={s.linkBtn}>View all →</Link>} />
        {tasks.isLoading ? <View style={{ padding: 24 }}><ActivityIndicator color={colors.accent} /></View> :
          taskList.filter(t => t.priority === 'critical' || t.priority === 'high').slice(0, 6).map(t => (
            <View key={t.id} style={s.row}>
              <Pill value={t.priority} kind="priority" />
              <View style={{ flex: 1, paddingHorizontal: 10 }}>
                <Text style={s.rowTitle}>{t.title}</Text>
                <Text style={s.rowSub}>{t.assignee?.name ?? 'unassigned'} · due {fmtRelative(t.due_date)}</Text>
              </View>
              <Pill value={t.status} />
            </View>
          ))
        }
        {!tasks.isLoading && taskList.filter(t => t.priority === 'critical' || t.priority === 'high').length === 0 && (
          <View style={s.empty}><Text style={{ color: colors.fgMuted }}>No hot tasks. 🎉</Text></View>
        )}
      </Card>
    </ScrollView>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: 'warn' }) {
  return (
    <View style={s.stat}>
      <View style={[s.statAccent, tone === 'warn' && { backgroundColor: colors.warn }]} />
      <Text style={s.statLabel}>{label.toUpperCase()}</Text>
      <Text style={s.statValue}>{value}</Text>
      {hint && <Text style={s.statHint}>{hint}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { padding: 16, paddingBottom: 80 },
  h1:         { color: colors.fg, fontSize: 26, fontWeight: '700', letterSpacing: -0.4, marginBottom: 4 },
  sub:        { color: colors.fgMuted, fontSize: 13, marginBottom: 14 },
  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat:       { flexBasis: '48%', backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, position: 'relative', overflow: 'hidden' },
  statAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.accent, opacity: 0.6 },
  statLabel:  { color: colors.fgMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.6 },
  statValue:  { color: colors.fg, fontSize: 26, fontWeight: '700', marginTop: 4, letterSpacing: -0.5 },
  statHint:   { color: colors.fgFaint, fontSize: 10, marginTop: 2 },
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  rowTitle:   { color: colors.fg, fontWeight: '600', fontSize: 13 },
  rowSub:     { color: colors.fgFaint, fontSize: 11, marginTop: 2 },
  empty:      { padding: 24, alignItems: 'center' },
  linkBtn:    { color: colors.fgMuted, fontSize: 12, fontWeight: '600' },
});
