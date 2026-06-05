// Generic, face-agnostic login. Reads the active face from GroupContext, prefills
// its seeded demo creds, and shows a banner in the face's accent. The Host header
// (set by GroupContext) already targets the chosen backend group, so login is
// group-aware: a 403 means "authenticated but not a member of THIS group" — the
// membership demo (e.g. agency creds against the vendor host).
import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@rhino-dev/rhino-react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/Toaster';
import { useGroup } from '../src/groups/GroupContext';
import { wasRecentlyForbidden } from '../src/lib/api';
import { colors, radii } from '../theme';

export default function LoginScreen() {
  const { active, clearGroup } = useGroup();
  const { login } = useAuth();
  const toast = useToast();
  const face = active?.face;

  const [email, setEmail] = useState(face?.demo.email ?? '');
  const [password, setPassword] = useState(face?.demo.password ?? '');
  const [busy, setBusy] = useState(false);

  if (!active || !face) return null; // gate will redirect to '/'
  const accent = face.accent;

  async function submit() {
    setBusy(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast(`Welcome to ${face!.label}`, 'ok');
        return; // gate routes to /workspace
      }
      // A 403 from group-membership enforcement is captured by the API layer's
      // onForbidden handler. Show a face-specific membership message for it.
      const msg = wasRecentlyForbidden()
        ? `You're not a member of the ${face!.label}.`
        : result.error ?? 'Login failed';
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg0 }}>
        <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
          {/* Face banner */}
          <View style={[s.banner, { borderColor: accent }]}>
            <View style={[s.accentBar, { backgroundColor: accent }]} />
            <Text style={[s.bannerLabel, { color: accent }]}>{face.label}</Text>
            <Text style={s.bannerMeta}>
              {active.org ? `org ${active.org} · ` : ''}host {active.host}
            </Text>
          </View>

          <View style={s.card}>
            <Text style={s.title}>Sign in</Text>
            <Text style={s.sub}>Group-aware auth — the Host header selects the backend group.</Text>

            <View style={{ gap: 14 }}>
              <Field label="Email">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholderTextColor={colors.fgFaint}
                  style={s.input}
                />
              </Field>
              <Field label="Password">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor={colors.fgFaint}
                  style={s.input}
                />
              </Field>

              <Pressable onPress={submit} disabled={busy} style={({ pressed }) => [s.btn, { backgroundColor: accent, opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}>
                <Ionicons name="lock-closed-outline" size={14} color="#001714" />
                <Text style={s.btnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
              </Pressable>

              <Pressable onPress={clearGroup} style={s.switchBtn}>
                <Ionicons name="swap-horizontal" size={14} color={colors.fgMuted} />
                <Text style={s.switchText}>Switch group</Text>
              </Pressable>
            </View>

            <View style={s.hint}>
              <Text style={[s.hintText, { color: accent, fontWeight: '700' }]}># Seeded {face.label} account</Text>
              <Text style={s.hintText}>{face.demo.email} · password</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { flexGrow: 1, padding: 24, justifyContent: 'center' },
  banner:     { backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, padding: 16, marginBottom: 16, overflow: 'hidden' },
  accentBar:  { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.8 },
  bannerLabel:{ fontSize: 16, fontWeight: '700' },
  bannerMeta: { color: colors.fgFaint, fontSize: 11, marginTop: 3, fontFamily: 'monospace' },
  card:       { backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 24 },
  title:      { color: colors.fg, fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  sub:        { color: colors.fgMuted, fontSize: 13, textAlign: 'center', marginBottom: 20 },
  label:      { color: colors.fgMuted, fontWeight: '600', fontSize: 12 },
  input:      { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, color: colors.fg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: radii.sm },
  btnText:    { color: '#001714', fontWeight: '700', fontSize: 14 },
  switchBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  switchText: { color: colors.fgMuted, fontSize: 13, fontWeight: '600' },
  hint:       { marginTop: 18, padding: 14, borderRadius: radii.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, gap: 4 },
  hintText:   { color: colors.fgMuted, fontSize: 12, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
});
