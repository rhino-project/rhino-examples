import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useModelIndex, useModelStore, useModelDelete } from '@rhino-dev/rhino-react';
import type { Label } from '../types';
import { Button } from '../components/Button';
import { Card, CardHeader, CardEmpty } from '../components/Card';
import { useToast } from '../components/Toaster';
import { colors, radii } from '../theme';

const PRESETS = ['#00d9c0', '#60a5fa', '#ffb547', '#ff6b6b', '#b07cff', '#4ade80'];

export default function LabelsScreen() {
  const toast = useToast();
  const q     = useModelIndex<Label>('labels', { perPage: 200 });
  const store = useModelStore<Label>('labels');
  const del   = useModelDelete<Label>('labels');
  const [name, setName]   = useState('');
  const [color, setColor] = useState(PRESETS[0]);

  const list = q.data?.data ?? [];

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: 'Labels' }} />

      <Card>
        <CardHeader title="Create label" />
        <View style={{ padding: 14, gap: 12 }}>
          <Text style={s.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. urgent" placeholderTextColor={colors.fgFaint} style={s.input} />
          <Text style={s.label}>Color</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PRESETS.map(c => (
              <Pressable key={c} onPress={() => setColor(c)} style={[s.swatch, { backgroundColor: c, borderColor: color === c ? colors.fg : colors.border, borderWidth: color === c ? 2 : 1 }]} />
            ))}
          </View>
          <Button
            variant="primary"
            busy={store.isPending}
            onPress={async () => {
              if (!name.trim()) return;
              try { await store.mutateAsync({ name, color }); toast(`Created "${name}"`, 'ok'); setName(''); }
              catch (e) { toast(`Failed: ${(e as Error).message}`, 'error'); }
            }}
            icon={<Ionicons name="add" size={14} color="#001714" />}>Create</Button>
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <CardHeader title={`${list.length} labels`} />
        {q.isLoading ? <ActivityIndicator color={colors.accent} style={{ padding: 24 }} /> :
          list.length === 0 ? <CardEmpty>No labels yet.</CardEmpty> : (
            <View style={{ padding: 12, gap: 8 }}>
              {list.map(l => (
                <View key={l.id} style={s.row}>
                  <View style={[s.colorChip, { backgroundColor: l.color ?? '#888' }]} />
                  <Text style={{ color: colors.fg, fontWeight: '500', flex: 1 }}>{l.name}</Text>
                  <Text style={{ color: colors.fgFaint, fontSize: 11, marginRight: 8 }}>{l.color ?? ''}</Text>
                  <Pressable
                    onPress={() => Alert.alert(`Delete "${l.name}"?`, undefined, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: async () => { await del.mutateAsync(l.id); toast('Deleted', 'ok'); } },
                    ])}
                    style={s.deleteBtn}>
                    <Ionicons name="trash-outline" size={14} color={colors.fgMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )
        }
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:    { padding: 16, paddingBottom: 80 },
  label:   { color: colors.fgMuted, fontWeight: '600', fontSize: 12 },
  input:   { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, color: colors.fg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  swatch:  { width: 28, height: 28, borderRadius: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.bg2, borderRadius: radii.sm },
  colorChip: { width: 14, height: 14, borderRadius: 3 },
  deleteBtn: { padding: 6, borderRadius: 6, backgroundColor: colors.bg3 },
});
