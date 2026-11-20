import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space, useTheme } from './theme';

export function Card({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.sm },
});
