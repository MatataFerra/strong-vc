import { Link, Tabs } from 'expo-router';
import { Text } from 'react-native';

function SettingsLink() {
  return (
    <Link href="/settings" style={{ paddingHorizontal: 16 }} accessibilityLabel="Ajustes">
      <Text style={{ fontSize: 22 }}>⚙︎</Text>
    </Link>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerRight: SettingsLink }}>
      <Tabs.Screen name="index" options={{ title: 'Entrenar' }} />
      <Tabs.Screen name="history" options={{ title: 'Historial' }} />
      <Tabs.Screen name="routines" options={{ title: 'Rutinas' }} />
      <Tabs.Screen name="logs" options={{ title: 'Registros' }} />
      <Tabs.Screen name="trends" options={{ title: 'Tendencias' }} />
    </Tabs>
  );
}
