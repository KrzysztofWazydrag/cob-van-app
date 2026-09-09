import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { SupabaseClient } from '@supabase/supabase-js';
import { colors, radius, shadow, spacing, type } from '../theme';

export function AuthScreen({ client }: { client: SupabaseClient }) {
  const [signUp, setSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setError(null);
    setMessage(null);
    if (!email.trim() || !password || (signUp && !displayName.trim())) {
      setError('Please complete all fields.');
      return;
    }
    setBusy(true);
    try {
      if (signUp) {
        const { data, error: authError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (authError) throw authError;
        setPassword('');
        if (!data.session) {
          setSignUp(false);
          setMessage('Check your email to confirm your account, then return here to sign in.');
        }
      } else {
        const { error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setSignUp((current) => !current);
    setPassword('');
    setError(null);
    setMessage(null);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.brand}>Cob Van</Text>
          <Text style={styles.title}>{signUp ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.description}>{signUp ? 'Sign up to start using Cob Van.' : 'Sign in to continue.'}</Text>
          {signUp ? <View style={styles.field}><Text style={styles.label}>Display name</Text><TextInput accessibilityLabel="Display name" autoComplete="name" editable={!busy} maxLength={100} onChangeText={setDisplayName} placeholder="Your name" style={styles.input} value={displayName} /></View> : null}
          <View style={styles.field}><Text style={styles.label}>Email</Text><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" autoCorrect={false} editable={!busy} keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" style={styles.input} value={email} /></View>
          <View style={styles.field}><Text style={styles.label}>Password</Text><TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete={signUp ? 'new-password' : 'current-password'} autoCorrect={false} editable={!busy} onChangeText={setPassword} onSubmitEditing={submit} placeholder="Password" returnKeyType="go" secureTextEntry style={styles.input} value={password} /></View>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, (busy || pressed) && styles.pressed]}><Text style={styles.primaryText}>{busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={toggleMode} style={styles.secondary}><Text style={styles.secondaryText}>{signUp ? 'Already have an account? Sign in' : 'New to Cob Van? Sign up'}</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.cream, flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', marginHorizontal: 'auto', maxWidth: 480, padding: spacing.xxl, width: '100%' },
  brand: { color: colors.ink, fontSize: type.hero, fontWeight: '900', marginBottom: spacing.xxl },
  title: { color: colors.ink, fontSize: type.hero, fontWeight: '900' },
  description: { color: colors.muted, fontSize: type.body, marginBottom: spacing.xl, marginTop: spacing.sm },
  field: { marginBottom: spacing.lg },
  label: { color: colors.ink, fontSize: type.label, fontWeight: '800', marginBottom: spacing.sm },
  input: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: type.body, minHeight: 56, paddingHorizontal: spacing.lg },
  error: { color: colors.red, marginBottom: spacing.md },
  message: { color: colors.green, lineHeight: type.title, marginBottom: spacing.md },
  primary: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.pill, justifyContent: 'center', minHeight: 56, ...shadow },
  primaryText: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  pressed: { opacity: 0.72 },
  secondary: { alignItems: 'center', minHeight: 48, paddingTop: spacing.lg },
  secondaryText: { color: colors.ink, fontSize: type.label, fontWeight: '800' },
});
