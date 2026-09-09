import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  eq: vi.fn(),
  single: vi.fn().mockResolvedValue({
    data: { display_name: 'Kris', role: 'customer', workplace_id: null },
    error: null,
  }),
}));

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: mocks.eq })) })),
  },
}));

import { useCurrentProfile } from '../src/auth/useCurrentProfile';

mocks.eq.mockReturnValue({ single: mocks.single });

function ProfileHarness() {
  const { profile, loading, error, reload } = useCurrentProfile({
    id: '00000000-0000-4000-8000-000000000001',
    email: 'kris@example.com',
    user_metadata: { display_name: 'Signup fallback' },
  } as any);
  return React.createElement('ProfileResult', { profile, loading, error, reload });
}

test('loads the authenticated profile display name as the shared identity source', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<ProfileHarness />); });
  expect(mocks.eq).toHaveBeenCalledWith('id', '00000000-0000-4000-8000-000000000001');
  expect(mocks.single).toHaveBeenCalledOnce();
  expect(tree.root.findByType('ProfileResult' as never).props.profile).toEqual({
    displayName: 'Kris',
    role: 'customer',
    workplaceId: null,
    workplaceName: null,
  });
  await act(async () => tree.unmount());
});


test('reload and remount read workplace membership from Supabase, including its real name', async () => {
  mocks.single.mockResolvedValue({ data: { display_name: 'Kris', role: 'customer', workplace_id: 'acero-id', workplaces: { name: 'ACERO' } }, error: null });
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<ProfileHarness />); });
  const result = () => tree.root.findByType('ProfileResult' as never).props;
  expect(result().profile).toMatchObject({ workplaceId: 'acero-id', workplaceName: 'ACERO' });
  expect(result().loading).toBe(false);
  await act(async () => result().reload());
  expect(result().profile.workplaceName).toBe('ACERO');
  await act(async () => tree.unmount());
  await act(async () => { tree = create(<ProfileHarness />); });
  expect(result().profile.workplaceId).toBe('acero-id');
  await act(async () => tree.unmount());
});

test('network failures finish loading and can be retried', async () => {
  mocks.single.mockRejectedValueOnce(new Error('Offline'));
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<ProfileHarness />); });
  const result = () => tree.root.findByType('ProfileResult' as never).props;
  expect(result().error).toContain('temporarily unavailable');
  expect(result().loading).toBe(false);
  await act(async () => result().reload());
  expect(result().error).toBeNull();
  await act(async () => tree.unmount());
});
