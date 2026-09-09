import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthScreen } from '../screens/AuthScreen';
import { colors, radius, spacing, type } from '../theme';

export function AuthGate({ children }: { children: ReactNode }) {
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
    const appStateSubscription = Platform.OS !== 'web' ? AppState.addEventListener('change', refreshForState) : null;
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

  if (!supabase) return <SafeAreaView style={styles.center}><StatusBar style="dark" /><Text style={styles.title}>Cob Van</Text><Text style={styles.message}>Authentication is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env, then restart Expo.</Text></SafeAreaView>;
  if (loading) return <SafeAreaView style={styles.center}><StatusBar style="dark" /><ActivityIndicator color={colors.ink} /><Text style={styles.message}>Restoring your session…</Text></SafeAreaView>;
  if (!session && error) return <SafeAreaView style={styles.center}><StatusBar style="dark" /><Text accessibilityRole="alert" style={styles.message}>{error}</Text><Pressable accessibilityRole="button" style={styles.button} onPress={() => setAttempt((value) => value + 1)}><Text style={styles.buttonText}>Try again</Text></Pressable></SafeAreaView>;
  if (!session) return <AuthScreen client={supabase} />;

  return <View key={session.user.id} style={styles.app}><View style={styles.app}>{children}</View><SafeAreaView edges={['bottom']} style={styles.footer}>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Pressable accessibilityRole="button" accessibilityState={{ disabled: signingOut, busy: signingOut }} disabled={signingOut} onPress={signOut} style={styles.button}><Text style={styles.buttonText}>{signingOut ? 'Logging out…' : 'Log out'}</Text></Pressable></SafeAreaView></View>;
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  center: { alignItems: 'center', backgroundColor: colors.cream, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xxl },
  title: { color: colors.ink, fontSize: type.hero, fontWeight: '900' },
  message: { color: colors.ink, fontSize: type.body, textAlign: 'center' },
  footer: { alignItems: 'center', backgroundColor: colors.cream, gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  button: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.pill, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.xl },
  buttonText: { color: colors.ink, fontSize: type.label, fontWeight: '800' },
  error: { color: colors.red, textAlign: 'center' },
});
