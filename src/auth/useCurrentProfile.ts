import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type CurrentProfile = {
  displayName: string;
  role: 'customer' | 'owner' | 'driver';
  workplaceId: string | null;
};

type ProfileRow = {
  display_name: string | null;
  role: CurrentProfile['role'];
  workplace_id: string | null;
};

export function useCurrentProfile(user: User) {
  const metadataName = typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name.trim() : '';
  const fallbackName = metadataName || user.email?.split('@')[0] || 'Customer';
  const [profile, setProfile] = useState<CurrentProfile>({ displayName: fallbackName, role: 'customer', workplaceId: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    if (!supabase) return;

    supabase
      .from('profiles')
      .select('display_name, role, workplace_id')
      .eq('id', user.id)
      .single()
      .then(({ data, error: profileError }) => {
        if (!active) return;
        if (profileError) {
          setError('Profile details are temporarily unavailable.');
          return;
        }
        const row = data as ProfileRow;
        setProfile({
          displayName: row.display_name?.trim() || fallbackName,
          role: row.role,
          workplaceId: row.workplace_id,
        });
      });

    return () => { active = false; };
  }, [fallbackName, user.id]);

  return { error, profile };
}
