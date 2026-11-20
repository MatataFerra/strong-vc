import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { space, useTheme } from './theme';

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={styles.box} accessibilityLabel={label}>
      <ActivityIndicator color={t.accent} />
      <Text style={{ color: t.muted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ box: { padding: space.xl, alignItems: 'center', gap: space.sm } });
