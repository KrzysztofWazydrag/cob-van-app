import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { colors, radius } from '../theme';

type Props = {
  onJoined: () => void;
  onSignOut: () => Promise<void>;
  signingOut: boolean;
  signOutError: string | null;
};

export function WorkplaceOnboardingScreen({ onJoined, onSignOut, signingOut, signOutError }: Props) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    if (submitting.current || signingOut || !supabase) return;
    if (!code.trim()) { setError('Enter your workplace code.'); return; }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const { error: joinError } = await supabase.rpc('join_workplace', { workplace_code: code.trim() });
      if (joinError) {
        setError(joinError.code === 'P0001'
          ? "We couldn't find that workplace code."
          : 'Unable to join your workplace. Please try again.');
        return;
      }
      onJoined();
    } catch {
      setError('Unable to join your workplace. Check your connection and try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>COB VAN</Text>
          <Text accessibilityRole="header" style={styles.title}>Join your workplace</Text>
          <Text style={styles.copy}>The Cob Van visits workplaces on its route. Enter the workplace code provided by your van.</Text>
          <Text style={styles.label}>Workplace code</Text>
          <TextInput
            accessibilityLabel="Workplace code" autoCapitalize="characters" autoCorrect={false}
            editable={!busy && !signingOut} onChangeText={setCode} onSubmitEditing={() => void join()}
            returnKeyType="go" style={styles.input} value={code}
          />
          {error || signOutError ? <Text accessibilityRole="alert" style={styles.error}>{error || signOutError}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || signingOut, busy }} disabled={busy || signingOut} onPress={() => void join()} style={styles.button}>
            <Text style={styles.buttonText}>{busy ? 'Joining…' : 'Join workplace'}</Text>
          </Pressable>
          {error ? <Pressable accessibilityRole="button" disabled={busy || signingOut} onPress={onJoined} style={styles.logout}>
            <Text style={styles.buttonText}>Refresh profile</Text>
          </Pressable> : null}
          <Pressable accessibilityRole="button" disabled={busy || signingOut} onPress={onSignOut} style={styles.logout}>
            <Text style={styles.buttonText}>{signingOut ? 'Logging out…' : 'Log out'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  brand: { color: colors.ink, fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 24 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900' },
  copy: { color: colors.ink, fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 28 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  input: { color: colors.ink, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.muted, borderRadius: radius.md, minHeight: 54, padding: 16, fontSize: 18 },
  button: { backgroundColor: colors.mustard, borderRadius: radius.pill, minHeight: 54, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  logout: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  error: { color: colors.red, marginTop: 12, fontSize: 14 },
});
