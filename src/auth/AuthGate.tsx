import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthScreen } from '../screens/AuthScreen';
import { colors, radius, spacing, type } from '../theme';

export type AuthenticatedAppProps = {
  session: Session;
  signOut: () => Promise<void>;
  signOutError: string | null;
  signingOut: boolean;
};

export function AuthGate({ children }: { children: (auth: AuthenticatedAppProps) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    let receivedAuthEvent = false;
    setLoading(true);
    setError(null);

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      receivedAuthEvent = true;
      setSession(nextSession);
      setLoading(false);
      setError(null);
    });

    // Supabase restores storage and refreshes expired tokens; no separate session cache.
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || receivedAuthEvent) return;
      if (sessionError) setError(sessionError.message);
      else setSession(data.session);
      setLoading(false);
    }).catch(() => {
      if (!active || receivedAuthEvent) return;
      setError('Unable to restore your session. Please try again.');
      setLoading(false);
    });

    const refreshForState = (state: string) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    };
    const appStateSubscription = Platform.OS !== 'web'
      ? AppState.addEventListener('change', refreshForState)
      : null;
    if (Platform.OS !== 'web') refreshForState(AppState.currentState);

    return () => {
      active = false;
      subscription.unsubscribe();
      appStateSubscription?.remove();
      if (Platform.OS !== 'web') client.auth.stopAutoRefresh();
    };
  }, [attempt]);

  async function signOut() {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) setError(signOutError.message);
    } catch {
      setError('Unable to log out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  if (!supabase) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.title}>Cob Van</Text>
        <Text style={styles.message}>Authentication is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env, then restart Expo.</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return <SafeAreaView style={styles.center}><StatusBar style="dark" /><ActivityIndicator color={colors.ink} /><Text style={styles.message}>Restoring your session…</Text></SafeAreaView>;
  }

  if (!session && error) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="dark" />
        <Text accessibilityRole="alert" style={styles.message}>{error}</Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => setAttempt((value) => value + 1)}><Text style={styles.buttonText}>Try again</Text></Pressable>
      </SafeAreaView>
    );
  }

  if (!session) return <AuthScreen client={supabase} />;

  return children({ session, signOut, signOutError: error, signingOut });
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16, backgroundColor: colors.cream },
  title: { fontSize: 32, fontWeight: '900', color: colors.ink },
  message: { color: colors.ink, textAlign: 'center', fontSize: 16 },
  button: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.pill, justifyContent: 'center', minHeight: spacing.xxxl, paddingHorizontal: spacing.md },
  buttonText: { color: colors.ink, fontSize: type.tiny, fontWeight: '800' },
});
