import { afterEach, expect, test, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => { storage.set(key, value); },
    removeItem: async (key: string) => { storage.delete(key); },
  },
}));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); storage.clear(); });

test('real Supabase client persists, restores, refreshes and clears its native storage session', async () => {
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://session-test.supabase.co');
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'test-public-key');
  const fetcher = vi.fn(async (url: string) => {
    if (url.includes('/logout')) return new Response('{}', { status: 200 });
    return new Response(JSON.stringify({
      access_token: 'test-access-token', refresh_token: 'test-refresh-token',
      token_type: 'bearer', expires_in: 3600,
      user: { id: 'test-user', email: 'test@example.com' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetcher);
  const clients: NonNullable<Awaited<typeof import('../src/lib/supabase')>['supabase']>[] = [];
  const loadClient = async () => {
    vi.resetModules();
    const { supabase } = await import('../src/lib/supabase');
    if (!supabase) throw new Error('Client missing');
    clients.push(supabase);
    await supabase.auth.getSession();
    await supabase.auth.stopAutoRefresh();
    return supabase;
  };
  try {
    const first = await loadClient();
    expect((await first.auth.getSession()).data.session).toBeNull();
    const signedIn = await first.auth.signInWithPassword({ email: 'test@example.com', password: 'password123' });
    expect(signedIn.error).toBeNull();
    expect(storage.size).toBe(1);
    fetcher.mockClear();
    const reopened = await loadClient();
    expect((await reopened.auth.getSession()).data.session?.user.id).toBe('test-user');
    expect(fetcher).not.toHaveBeenCalled();

    // Simulate reopening after access-token expiry. Only the SDK refreshes tokens.
    const [key, value] = [...storage.entries()][0];
    storage.set(key, JSON.stringify({ ...JSON.parse(value), expires_at: 1 }));
    const expired = await loadClient();
    expect((await expired.auth.getSession()).data.session?.user.id).toBe('test-user');
    expect(fetcher.mock.calls.some(([url]) => url.includes('grant_type=refresh_token'))).toBe(true);
    expect((await expired.auth.signOut({ scope: 'local' })).error).toBeNull();
    expect(storage.size).toBe(0);
    const afterLogout = await loadClient();
    expect((await afterLogout.auth.getSession()).data.session).toBeNull();
  } finally {
    for (const client of clients) await client.auth.stopAutoRefresh();
  }
});
