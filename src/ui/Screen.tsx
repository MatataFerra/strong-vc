import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { space, useTheme } from './theme';

export function Screen({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { padding: space.lg, gap: space.md, paddingBottom: 80 } });
