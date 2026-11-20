import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, useTheme } from './theme';

const ToastContext = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(null), 2000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message && (
        <View pointerEvents="none" style={[styles.toast, { backgroundColor: t.text }]} accessibilityLiveRegion="polite">
          <Text style={{ color: t.bg, fontWeight: '600' }}>{message}</Text>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: 20,
  },
});
