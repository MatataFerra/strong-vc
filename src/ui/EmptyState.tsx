import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, useTheme } from './theme';

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.box}>
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      <Text style={[styles.message, { color: t.muted }]}>{message}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: space.xl, alignItems: 'center', gap: space.md },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 15, textAlign: 'center' },
});
