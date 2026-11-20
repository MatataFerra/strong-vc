import { Pressable, StyleSheet, Text } from 'react-native';

import { space, useTheme } from './theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  testID?: string;
}

export function Button({ title, onPress, variant = 'primary', disabled, testID }: Props) {
  const t = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: primary ? t.accent : t.subtle, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.label, { color: primary ? t.accentText : t.text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: 10, alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
});
