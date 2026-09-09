import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type CurrentProfile = {
  displayName: string;
  role: 'customer' | 'owner' | 'driver';
  workplaceId: string | null;
  workplaceName: string | null;
};

type ProfileRow = {
  display_name: string | null;
  role: CurrentProfile['role'];
  workplace_id: string | null;
  workplaces: { name: string } | null;
};

export function useCurrentProfile(user: User) {
  const metadataName = typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name.trim() : '';
  const fallbackName = metadataName || user.email?.split('@')[0] || 'Customer';
  const [profile, setProfile] = useState<CurrentProfile>({ displayName: fallbackName, role: 'customer', workplaceId: null, workplaceName: null });
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setError(null);
    setLoading(true);
    if (!supabase) return;

    Promise.resolve(supabase
      .from('profiles')
      .select('display_name, role, workplace_id, workplaces(name)')
      .eq('id', user.id)
      .single())
      .then(({ data, error: profileError }) => {
        if (!active) return;
        setLoading(false);
        if (profileError || !data) {
          setError('Profile details are temporarily unavailable.');
          return;
        }
        const row = data as unknown as ProfileRow;
        setProfile({
          displayName: row.display_name?.trim() || fallbackName,
          role: row.role,
          workplaceId: row.workplace_id,
          workplaceName: row.workplaces?.name ?? null,
        });
      }).catch(() => {
        if (!active) return;
        setLoading(false);
        setError('Profile details are temporarily unavailable.');
      });

    return () => { active = false; };
  }, [fallbackName, user.id, attempt]);

  return { error, profile, loading, reload };
}
