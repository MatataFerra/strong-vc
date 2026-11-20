import { useCallback, useRef, useState } from 'react';

import { useToast } from './Toast';

export const ACTION_ERROR = 'No se pudo completar. Probá de nuevo.';

/**
 * Wraps a user action: ignores re-entry while it runs (double taps) and reports failures with a toast
 * instead of leaving an unhandled rejection.
 */
export function useSafeAction() {
  const toast = useToast();
  const running = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      if (running.current) return;
      running.current = true;
      setBusy(true);
      try {
        await action();
      } catch {
        toast(ACTION_ERROR);
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [toast],
  );

  return { run, busy };
}
