import { Stack } from 'expo-router';

import { DbProvider } from '../db/DbProvider';
import { ReminderSync } from '../notifications/ReminderSync';
import { ToastProvider } from '../ui/Toast';

export default function RootLayout() {
  return (
    <DbProvider>
      <ReminderSync />
      <ToastProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
        </Stack>
      </ToastProvider>
    </DbProvider>
  );
}
