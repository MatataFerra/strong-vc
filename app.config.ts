import type { ConfigContext, ExpoConfig } from 'expo/config';

// HealthKit is opt-in: the native entitlement is only added when explicitly enabled in .env.
const healthKitEnabled = process.env.EXPO_PUBLIC_HEALTHKIT_ENABLED === 'true';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    ...(healthKitEnabled
      ? [
          [
            '@kingstinct/react-native-healthkit',
            {
              NSHealthShareUsageDescription:
                'Strong personal lee solo los datos que actives (por ejemplo, sueño o pasos) para mostrarlos junto a tus registros.',
              NSHealthUpdateUsageDescription:
                'Strong personal guarda tus entrenamientos en Salud solo si lo activás.',
            },
          ] as [string, Record<string, string>],
        ]
      : []),
  ],
});
