import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { space, useTheme } from './theme';

export function Field(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[styles.input, { color: t.text, backgroundColor: t.subtle, borderColor: t.border }, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: space.sm, fontSize: 16 },
});
