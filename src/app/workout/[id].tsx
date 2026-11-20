import { Stack, useLocalSearchParams } from 'expo-router';

import { WorkoutDetail } from '../../features/history/WorkoutDetail';

export default function WorkoutRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Entrenamiento' }} />
      <WorkoutDetail id={Number(id)} />
    </>
  );
}
