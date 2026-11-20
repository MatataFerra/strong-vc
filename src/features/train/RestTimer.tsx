import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatClock, remainingSeconds } from '../../core/restTimer';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { space } from '../../ui/theme';
import { Body, Title } from '../../ui/Typography';

interface Props {
  endsAt: number;
  onAdjust: (deltaSeconds: number) => void;
  onSkip: () => void;
}

/** Counts down from a fixed end timestamp, so it stays correct after the app was in the background. */
export function RestTimer({ endsAt, onAdjust, onSkip }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const left = remainingSeconds(endsAt, now);

  return (
    <Card>
      <Body>{left > 0 ? 'Descanso' : 'Descanso terminado'}</Body>
      <Title testID="rest-remaining" style={styles.clock}>{formatClock(left)}</Title>
      <View style={styles.row}>
        <Button title="−15 s" variant="secondary" onPress={() => onAdjust(-15)} />
        <Button title="+15 s" variant="secondary" onPress={() => onAdjust(15)} />
        <Button title={left > 0 ? 'Saltar' : 'Cerrar'} variant="secondary" onPress={onSkip} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  clock: { fontSize: 40, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', gap: space.sm },
});
