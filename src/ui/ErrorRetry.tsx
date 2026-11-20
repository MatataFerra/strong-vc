import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { space, useTheme } from './theme';

export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={[styles.message, { color: t.text }]}>{message}</Text>
      <Button title="Reintentar" variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: space.xl, alignItems: 'center', gap: space.md },
  message: { fontSize: 15, textAlign: 'center' },
});
