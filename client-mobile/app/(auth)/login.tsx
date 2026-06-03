import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@rhino-dev/rhino-react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toaster';
import { colors, radii } from '../../theme';

const seeded = [
  { email: 'alice@acme.com', role: 'admin' },
  { email: 'bob@acme.com',   role: 'manager' },
  { email: 'carol@acme.com', role: 'member' },
  { email: 'dave@acme.com',  role: 'viewer' },
];

export default function LoginScreen() {
  const { login, setOrganization } = useAuth();
  const toast = useToast();
  const [email, setEmail]       = useState('alice@acme.com');
  const [password, setPassword] = useState('password');
  const [busy, setBusy]         = useState(false);

  async function submit() {
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.success) {
      toast(result.error ?? 'Login failed', 'error');
      return;
    }
    toast(`Welcome, ${result.user?.name ?? email}`, 'ok');
    if (result.organization_slug) setOrganization(result.organization_slug);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg0 }}>
        <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
          <View style={s.brand}>
            <View style={s.mark}><Text style={s.markText}>R</Text></View>
            <Text style={s.brandName}>TaskFlow <Text style={{ color: colors.fgMuted, fontWeight: '500' }}>/mobile</Text></Text>
          </View>

          <View style={s.card}>
            <Text style={s.title}>Sign in to your workspace</Text>
            <Text style={s.sub}>Multi-tenant project management — powered by Rhino.</Text>

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
              <Button variant="primary" onPress={submit} busy={busy} icon={<Ionicons name="lock-closed-outline" size={14} color="#001714" />}>
                Sign in
              </Button>
            </View>

            <View style={s.hint}>
              <Text style={[s.hintText, { color: colors.accent, fontWeight: '700' }]}># Seeded accounts</Text>
              {seeded.map(u => (
                <Pressable key={u.email} onPress={() => { setEmail(u.email); setPassword('password'); }}>
                  <Text style={s.hintText}>{u.email} · password <Text style={{ color: colors.fgFaint }}>→ {u.role}</Text></Text>
                </Pressable>
              ))}
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
  wrap:     { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brand:    { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 24 },
  mark:     { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#001714', fontWeight: '800', fontSize: 15 },
  brandName:{ color: colors.fg, fontSize: 18, fontWeight: '700' },
  card:     { backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 24 },
  title:    { color: colors.fg, fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  sub:      { color: colors.fgMuted, fontSize: 13, textAlign: 'center', marginBottom: 20 },
  label:    { color: colors.fgMuted, fontWeight: '600', fontSize: 12 },
  input:    { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, color: colors.fg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  hint:     { marginTop: 18, padding: 14, borderRadius: radii.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, gap: 4 },
  hintText: { color: colors.fgMuted, fontSize: 12, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
});
