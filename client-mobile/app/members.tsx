import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useModelIndex, useInvitations, useInviteUser, useCancelInvitation, useResendInvitation } from '@rhino-dev/rhino-react';
import type { User } from '../types';
import { Card, CardHeader, CardEmpty } from '../components/Card';
import { Button } from '../components/Button';
import { useToast } from '../components/Toaster';
import { colors, radii } from '../theme';
import { fmtRelative, initials } from '../lib/format';

const ROLES = ['admin', 'manager', 'member', 'viewer'] as const;

export default function MembersScreen() {
  const toast = useToast();
  const users       = useModelIndex<User>('users', { perPage: 200 });
  const invitations = useInvitations();
  const invite      = useInviteUser();
  const resend      = useResendInvitation();
  const cancel      = useCancelInvitation();
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState<typeof ROLES[number]>('member');

  const memberList = users.data?.data ?? [];
  const pendingList = (invitations.data as any[] | undefined) ?? [];

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: 'Members' }} />

      <Card>
        <CardHeader title="Invite user" />
        <View style={{ padding: 14, gap: 12 }}>
          <Text style={s.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="newcomer@example.com"
            placeholderTextColor={colors.fgFaint}
            keyboardType="email-address"
            autoCapitalize="none"
            style={s.input}
          />
          <Text style={s.label}>Role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {ROLES.map(r => (
              <Pressable key={r} onPress={() => setRole(r)} style={[s.chip, role === r && s.chipActive]}>
                <Text style={[s.chipText, role === r && s.chipTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button
            variant="primary"
            busy={invite.isPending}
            onPress={async () => {
              try { await invite.mutateAsync({ email, role }); toast(`Invitation sent to ${email}`, 'ok'); setEmail(''); }
              catch (e) { toast(`Failed: ${(e as Error).message}`, 'error'); }
            }}
            icon={<Ionicons name="paper-plane-outline" size={14} color="#001714" />}>Send invite</Button>
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <CardHeader title="Pending invitations" />
        {invitations.isLoading ? <ActivityIndicator color={colors.accent} style={{ padding: 24 }} /> :
          pendingList.length === 0 ? <CardEmpty>No pending invitations.</CardEmpty> : (
            <View style={{ padding: 12, gap: 8 }}>
              {pendingList.map(inv => (
                <View key={inv.id} style={s.invRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.fg, fontWeight: '500', fontSize: 13 }}>{inv.email}</Text>
                    <Text style={s.faint}>{inv.role ?? '—'} · sent {fmtRelative(inv.created_at)}</Text>
                  </View>
                  <Pressable onPress={async () => { await resend.mutateAsync(inv.id); toast('Invitation resent', 'ok'); }} style={s.invBtn}>
                    <Text style={{ color: colors.fg, fontSize: 11, fontWeight: '600' }}>Resend</Text>
                  </Pressable>
                  <Pressable onPress={async () => { await cancel.mutateAsync(inv.id); toast('Invitation cancelled', 'ok'); }} style={[s.invBtn, { backgroundColor: colors.danger }]}>
                    <Text style={{ color: '#2a0000', fontSize: 11, fontWeight: '600' }}>Cancel</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )
        }
      </Card>

      <Card style={{ marginTop: 14 }}>
        <CardHeader title={`${memberList.length} members`} />
        {users.isLoading ? <ActivityIndicator color={colors.accent} style={{ padding: 24 }} /> : (
          <View>
            {memberList.map(u => (
              <View key={u.id} style={s.memberRow}>
                <View style={s.avatar}><Text style={s.avatarText}>{initials(u.name)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.fg, fontWeight: '500', fontSize: 13 }}>{u.name}</Text>
                  <Text style={s.faint}>{u.email}</Text>
                </View>
                <Text style={s.faint}>{fmtRelative(u.created_at)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:       { padding: 16, paddingBottom: 80 },
  label:      { color: colors.fgMuted, fontWeight: '600', fontSize: 12 },
  input:      { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, color: colors.fg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chip:       { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.bg2, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.bg3, borderColor: colors.accentDim },
  chipText:   { color: colors.fgMuted, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  invRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.bg2, borderRadius: radii.sm },
  invBtn:     { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.bg3, borderRadius: radii.sm },
  memberRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  avatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: '#5b8def', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  faint:      { color: colors.fgFaint, fontSize: 11, marginTop: 2 },
});
