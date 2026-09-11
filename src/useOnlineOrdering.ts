import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { canOrderOnline } from './onlineOrdering';

export function useOnlineOrdering(orderCutoffAt: number): boolean {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      if (canOrderOnline(orderCutoffAt, current)) {
        timer = setTimeout(refresh, Math.min(orderCutoffAt - current, 2_147_483_647));
      }
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [orderCutoffAt]);
  return canOrderOnline(orderCutoffAt, now);
}
