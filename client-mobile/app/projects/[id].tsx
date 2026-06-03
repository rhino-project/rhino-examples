import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable, Modal, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useModelShow, useModelIndex, useModelAudit, useModelUpdate, useModelDelete } from '@rhino-dev/rhino-react';
import type { Project, Task, User } from '../../types';
import { Card, CardHeader, CardEmpty } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toaster';
import { colors, radii } from '../../theme';
import { fmtCurrency, fmtDate, fmtRelative } from '../../lib/format';

type TaskWithAssignee = Task & { assignee?: User };

export default function ProjectDetail() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const toast   = useToast();
  const project = useModelShow<Project>('projects', id);
  const tasks   = useModelIndex<TaskWithAssignee>('tasks', { includes: ['assignee'], perPage: 200 });
  const audit   = useModelAudit('projects', id ?? null);
  const update  = useModelUpdate<Project>('projects');
  const del     = useModelDelete<Project>('projects');

  const [tab, setTab] = useState<'tasks' | 'audit'>('tasks');
  const [editing, setEditing] = useState(false);

  if (project.isLoading) return <View style={s.center}><ActivityIndicator color={colors.accent} /></View>;
  const p = project.data;
  if (!p) return <View style={s.center}><Text style={{ color: colors.fgMuted }}>Project not found.</Text></View>;

  const projectTasks = (tasks.data?.data ?? []).filter(t => String(t.project_id) === String(id));
  const auditList    = audit.data?.data ?? [];
  const canSeeBudget = p.budget != null;
  const canSeeNotes  = (p as any).internal_notes != null;

  function handleDelete() {
    Alert.alert(`Delete "${p!.title}"?`, 'Moved to trash; you can restore it later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await del.mutateAsync(p!.id); toast('Project moved to trash', 'ok'); router.back(); } },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: p.title, headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.headRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Pill value={p.status} />
            </View>
            <Text style={s.h1}>{p.title}</Text>
            {p.description && <Text style={s.sub}>{p.description}</Text>}
          </View>
        </View>

        <View style={s.actionRow}>
          <Button onPress={() => setEditing(true)} icon={<Ionicons name="create-outline" size={14} color={colors.fg} />}>Edit</Button>
          <Button variant="danger" onPress={handleDelete} icon={<Ionicons name="trash-outline" size={14} color="#2a0000" />}>Delete</Button>
        </View>

        <Card style={{ marginTop: 14 }}>
          <CardHeader title="Project details" />
          <View style={{ padding: 14, gap: 10 }}>
            <Kv k="ID"      v={String(p.id)} />
            <Kv k="Org"     v={`#${p.organization_id}`} />
            <Kv k="Status"  v={<Pill value={p.status} />} />
            <Kv k="Budget"  v={canSeeBudget ? fmtCurrency(p.budget) : <Text style={s.rbacHidden}>— hidden by role policy</Text>} />
            <Kv k="Starts"  v={fmtDate(p.starts_at)} />
            <Kv k="Ends"    v={fmtDate(p.ends_at)} />
            <Kv k="Created" v={fmtDate(p.created_at)} />
            <Kv k="Updated" v={fmtRelative(p.updated_at)} />
          </View>
        </Card>

        {canSeeNotes && (
          <Card style={{ marginTop: 14 }}>
            <CardHeader title="Internal notes" action={<Text style={s.badge}>ADMIN ONLY</Text>} />
            <Text style={{ padding: 14, color: colors.fg, fontSize: 13, lineHeight: 19 }}>{(p as any).internal_notes}</Text>
          </Card>
        )}

        <View style={s.tabRow}>
          <TabBtn active={tab === 'tasks'} onPress={() => setTab('tasks')}>Tasks ({projectTasks.length})</TabBtn>
          <TabBtn active={tab === 'audit'} onPress={() => setTab('audit')}>Audit trail</TabBtn>
        </View>

        {tab === 'tasks' && (
          <Card>
            <CardHeader title="Tasks in this project" action={<Text style={s.codeMeta}>?include=assignee</Text>} />
            {tasks.isLoading ? <ActivityIndicator color={colors.accent} style={{ padding: 24 }} /> :
              projectTasks.length === 0 ? <CardEmpty>No tasks yet.</CardEmpty> : (
                <View>
                  {projectTasks.map(t => (
                    <View key={t.id} style={s.taskRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.taskTitle}>{t.title}</Text>
                        <Text style={s.taskSub}>{t.assignee?.name ?? 'unassigned'} · due {fmtDate(t.due_date)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Pill value={t.status} />
                        <Pill value={t.priority} kind="priority" />
                      </View>
                    </View>
                  ))}
                </View>
              )
            }
          </Card>
        )}

        {tab === 'audit' && (
          <Card>
            <CardHeader title="Audit history" action={<Text style={s.codeMeta}>useModelAudit</Text>} />
            {audit.isLoading ? <ActivityIndicator color={colors.accent} style={{ padding: 24 }} /> :
              auditList.length === 0 ? <CardEmpty>No audit entries yet — try editing the project to generate one.</CardEmpty> : (
                <View style={{ padding: 14, gap: 10 }}>
                  {auditList.map(entry => (
                    <View key={entry.id} style={s.audit}>
                      <View style={s.dot} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.fg, fontSize: 13 }}>
                          <Text style={{ fontWeight: '700' }}>{entry.action}</Text> by user #{entry.user_id}
                        </Text>
                        <Text style={s.auditMeta}>{fmtRelative(entry.created_at)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )
            }
          </Card>
        )}
      </ScrollView>

      {editing && (
        <EditModal
          project={p}
          busy={update.isPending}
          onClose={() => setEditing(false)}
          onSave={async data => {
            try { await update.mutateAsync({ id: p.id, data }); toast('Project updated', 'ok'); setEditing(false); }
            catch (e) { toast(`Update failed: ${(e as Error).message}`, 'error'); }
          }}
        />
      )}
    </>
  );
}

function Kv({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ width: 80, color: colors.fgMuted, fontSize: 12 }}>{k}</Text>
      {typeof v === 'string' || typeof v === 'number' ?
        <Text style={{ color: colors.fg, fontSize: 13, flex: 1 }}>{v}</Text> :
        <View style={{ flex: 1 }}>{v}</View>}
    </View>
  );
}

function TabBtn({ active, children, onPress }: { active: boolean; children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.tabBtn, active && s.tabActive]}>
      <Text style={[s.tabBtnText, active && { color: '#001714' }]}>{children}</Text>
    </Pressable>
  );
}

function EditModal({ project, onClose, onSave, busy }: { project: Project; onClose: () => void; onSave: (data: Partial<Project>) => Promise<void>; busy: boolean }) {
  const [title, setTitle]   = useState(project.title);
  const [status, setStatus] = useState(project.status);
  const [desc, setDesc]     = useState(project.description ?? '');
  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg1 }}>
        <View style={s.modalHead}>
          <Text style={s.modalTitle}>Edit project</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={20} color={colors.fgMuted} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={s.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} style={s.input} placeholderTextColor={colors.fgFaint} />
          <Text style={s.label}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {(['draft', 'active', 'done', 'archived'] as const).map(st => (
              <Pressable key={st} onPress={() => setStatus(st)} style={[s.chip, status === st && s.chipActive]}>
                <Text style={[s.chipText, status === st && s.chipTextActive]}>{st}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={s.label}>Description</Text>
          <TextInput value={desc} onChangeText={setDesc} multiline style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholderTextColor={colors.fgFaint} />
          <Button variant="primary" busy={busy} onPress={() => onSave({ title, status, description: desc })} icon={<Ionicons name="checkmark" size={14} color="#001714" />}>Save</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap:        { padding: 16, paddingBottom: 80 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg0 },
  headRow:     { flexDirection: 'row' },
  h1:          { color: colors.fg, fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  sub:         { color: colors.fgMuted, fontSize: 13, marginTop: 4 },
  actionRow:   { flexDirection: 'row', gap: 10, marginTop: 14 },
  rbacHidden:  { color: colors.fgFaint, fontStyle: 'italic', fontSize: 12 },
  badge:       { color: colors.accent, fontSize: 10, fontWeight: '700', borderColor: colors.accentDim, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, letterSpacing: 0.5 },
  tabRow:      { flexDirection: 'row', gap: 6, marginTop: 18, marginBottom: 12 },
  tabBtn:      { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.bg2, borderRadius: radii.sm },
  tabActive:   { backgroundColor: colors.accent },
  tabBtnText:  { color: colors.fgMuted, fontWeight: '600', fontSize: 13 },
  codeMeta:    { color: colors.fgFaint, fontSize: 11, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  taskRow:     { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  taskTitle:   { color: colors.fg, fontSize: 13, fontWeight: '500' },
  taskSub:     { color: colors.fgFaint, fontSize: 11, marginTop: 2 },
  audit:       { flexDirection: 'row', gap: 10 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 },
  auditMeta:   { color: colors.fgFaint, fontSize: 11, marginTop: 2 },
  modalHead:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:  { color: colors.fg, fontSize: 16, fontWeight: '600' },
  label:       { color: colors.fgMuted, fontWeight: '600', fontSize: 12 },
  input:       { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, color: colors.fg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.bg2, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipActive:  { backgroundColor: colors.bg3, borderColor: colors.accentDim },
  chipText:    { color: colors.fgMuted, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
});
