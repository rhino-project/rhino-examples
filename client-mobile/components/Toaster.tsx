import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';

type ToastKind = 'info' | 'ok' | 'error';
type Toast = { id: number; kind: ToastKind; message: string };

type Ctx = (message: string, kind?: ToastKind) => void;
const ToastCtx = createContext<Ctx>(() => {});

let _id = 0;
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  const push = useCallback<Ctx>((message, kind = 'info') => {
    const id = ++_id;
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <View pointerEvents="none" style={[s.stack, { bottom: insets.bottom + 16 }]}>
        {toasts.map(t => (
          <View key={t.id} style={[s.toast, { borderLeftColor: kindColor(t.kind) }]}>
            <Text style={s.text}>{t.message}</Text>
          </View>
        ))}
      </View>
    </ToastCtx.Provider>
  );
}

function kindColor(k: ToastKind) {
  if (k === 'error') return colors.danger;
  if (k === 'ok')    return colors.ok;
  return colors.accent;
}

export function useToast() { return useContext(ToastCtx); }

const s = StyleSheet.create({
  stack: { position: 'absolute', left: 16, right: 16, gap: 8 },
  toast: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.borderStrong, borderLeftWidth: 3, borderRadius: radii.sm, paddingVertical: 10, paddingHorizontal: 14 },
  text: { color: colors.fg, fontSize: 13 },
});
