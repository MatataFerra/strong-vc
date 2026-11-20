import { Text, type TextProps } from 'react-native';

import { useTheme } from './theme';

export function Title(props: TextProps) {
  const t = useTheme();
  return <Text {...props} style={[{ color: t.text, fontSize: 20, fontWeight: '700' }, props.style]} />;
}

export function Body(props: TextProps) {
  const t = useTheme();
  return <Text {...props} style={[{ color: t.text, fontSize: 16 }, props.style]} />;
}

export function Muted(props: TextProps) {
  const t = useTheme();
  return <Text {...props} style={[{ color: t.muted, fontSize: 14 }, props.style]} />;
}
