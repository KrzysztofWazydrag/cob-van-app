import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ listener: null as null | ((state: string) => void), remove: vi.fn() }));
vi.mock('react-native', () => ({
  AppState: { addEventListener: (_event: string, listener: typeof mocks.listener) => {
    mocks.listener = listener;
    return { remove: mocks.remove };
  } },
}));
import { useOnlineOrdering } from '../src/useOnlineOrdering';

function Eligibility({ cutoff }: { cutoff: number }) {
  return <>{useOnlineOrdering(cutoff) ? 'open' : 'closed'}</>;
}

test.each(['timeout', 'resume'])('customer eligibility refreshes on %s and cleans up', async (trigger) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.setSystemTime(0);
  mocks.remove.mockClear();
  let tree!: ReturnType<typeof create>;
  try {
    await act(async () => { tree = create(<Eligibility cutoff={1000} />); });
    expect(tree.toJSON()).toBe('open');
    await act(async () => {
      if (trigger === 'timeout') vi.advanceTimersByTime(1000);
      else {
        vi.setSystemTime(1001);
        mocks.listener?.('active');
      }
    });
    expect(tree.toJSON()).toBe('closed');
  } finally {
    if (tree) await act(async () => tree.unmount());
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});
