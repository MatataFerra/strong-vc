import { Stack } from 'expo-router';

import { DbProvider } from '../db/DbProvider';
import { ToastProvider } from '../ui/Toast';

export default function RootLayout() {
  return (
    <DbProvider>
      <ToastProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
        </Stack>
      </ToastProvider>
    </DbProvider>
  );
}
