import { useColorScheme } from 'react-native';

const light = {
  bg: '#F7F6F3',
  card: '#FFFFFF',
  text: '#1F1F1C',
  muted: '#6B6A65',
  border: '#E3E1DB',
  accent: '#3E5C76',
  accentText: '#FFFFFF',
  subtle: '#ECEAE4',
};

const dark: typeof light = {
  bg: '#141413',
  card: '#1E1E1C',
  text: '#F1F0EC',
  muted: '#A3A19A',
  border: '#33322F',
  accent: '#8DAEC9',
  accentText: '#141413',
  subtle: '#2A2A27',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
