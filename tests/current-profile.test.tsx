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
  const { profile } = useCurrentProfile({
    id: '00000000-0000-4000-8000-000000000001',
    email: 'kris@example.com',
    user_metadata: { display_name: 'Signup fallback' },
  } as any);
  return React.createElement('ProfileResult', { profile });
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
  });
  await act(async () => tree.unmount());
});
