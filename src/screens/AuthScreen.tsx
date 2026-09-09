import { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import type { SupabaseClient } from '@supabase/supabase-js';
import authHero from '../../assets/auth-hero.png';
import { colors, radius, shadow, spacing, type } from '../theme';

type AuthField = 'displayName' | 'email' | 'password';

export function AuthScreen({ client }: { client: SupabaseClient }) {
  const [signUp, setSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<AuthField | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ownerContactVisible, setOwnerContactVisible] = useState(false);

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
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: 'cobvan://auth/callback',
          },
        });
        if (authError) throw authError;
        setPassword('');
        if (!data.session) {
          setSignUp(false);
          setMessage('Check your email to confirm your account, then return to Cob Van to sign in.');
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
    setShowPassword(false);
    setOwnerContactVisible(false);
    setError(null);
    setMessage(null);
  }

  async function contactOwner() {
    setOwnerContactVisible(true);
    try {
      await Linking.openURL('mailto:sitecrew.cc@gmail.com?subject=Cob%20Van%20owner%20onboarding');
    } catch {
      // The visible email address remains available if no mail app is configured.
    }
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ImageBackground source={authHero} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
            <View style={styles.heroShade} />
            <View style={styles.brandBlock}>
              <Text accessibilityRole="header" style={styles.brand}>
                <Text style={styles.brandCream}>Cob </Text>
                <Text style={styles.brandYellow}>Van</Text>
              </Text>
              <Text style={styles.tagline}>GOOD FOOD{`\n`}ON THE MOVE</Text>
              <View style={styles.brandRule} />
            </View>
          </ImageBackground>

          <View style={styles.panel}>
            <Text accessibilityRole="header" style={styles.title}>{signUp ? 'Create your account' : 'Welcome back'}</Text>
            <Text style={styles.description}>
              {signUp ? 'Join Cob Van and order ahead.' : 'Your next cob is just around the corner.'}
            </Text>

            {signUp ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Display name</Text>
                <View style={[styles.inputShell, focusedField === 'displayName' && styles.inputShellFocused]}>
                  <TextInput
                    accessibilityLabel="Display name"
                    autoComplete="name"
                    editable={!busy}
                    maxLength={100}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setDisplayName}
                    onFocus={() => setFocusedField('displayName')}
                    placeholder="How should we greet you?"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={displayName}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputShell, focusedField === 'email' && styles.inputShellFocused]}>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  editable={!busy}
                  keyboardType="email-address"
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputShell, focusedField === 'password' && styles.inputShellFocused]}>
                <TextInput
                  accessibilityLabel="Password"
                  autoCapitalize="none"
                  autoComplete={signUp ? 'new-password' : 'current-password'}
                  autoCorrect={false}
                  editable={!busy}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onSubmitEditing={submit}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  returnKeyType="go"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
                  hitSlop={8}
                  onPress={() => setShowPassword((visible) => !visible)}
                  style={styles.visibilityButton}
                >
                  <Feather color={colors.muted} name={showPassword ? 'eye-off' : 'eye'} size={20} />
                </Pressable>
              </View>
            </View>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={submit}
              style={({ pressed }) => [styles.primary, (busy || pressed) && styles.primaryPressed]}
            >
              <Text style={styles.primaryText}>{busy ? 'Please wait…' : signUp ? 'Create account  →' : 'Sign in  →'}</Text>
            </Pressable>

            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={toggleMode} style={styles.secondary}>
              <Text style={styles.switchText}>
                {signUp ? 'Already have an account? ' : 'New to Cob Van? '}
                <Text style={styles.switchAction}>{signUp ? 'Sign in' : 'Sign up'}</Text>
              </Text>
            </Pressable>

            {signUp ? (
              <View style={styles.ownerContact}>
                <Pressable accessibilityRole="link" onPress={contactOwner}>
                  <Text style={styles.ownerContactText}>Are you a van owner? <Text style={styles.ownerContactLink}>Contact us</Text></Text>
                </Pressable>
                {ownerContactVisible ? (
                  <Text accessibilityLiveRegion="polite" style={styles.ownerContactNote}>Owner accounts are set up manually. Email sitecrew.cc@gmail.com.</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.cream, flex: 1 },
  scrollContent: { backgroundColor: colors.cream, flexGrow: 1 },
  hero: { height: spacing.xxxl * 9, justifyContent: 'flex-start', overflow: 'hidden' },
  heroImage: { borderBottomLeftRadius: radius.lg * 2, borderBottomRightRadius: radius.lg * 2 },
  heroShade: { backgroundColor: 'rgba(13,27,42,0.18)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  brandBlock: { marginHorizontal: spacing.xxl, marginTop: spacing.xxxl + spacing.xl },
  brand: { fontSize: type.hero + spacing.sm, fontWeight: '900', letterSpacing: -1.5 },
  brandCream: { color: colors.cream },
  brandYellow: { color: colors.mustard },
  tagline: { color: colors.paper, fontSize: type.tiny, fontWeight: '900', letterSpacing: 3, lineHeight: type.body + spacing.xs, marginTop: spacing.sm },
  brandRule: { backgroundColor: colors.mustard, borderRadius: radius.pill, height: spacing.xs, marginTop: spacing.md, width: spacing.xxxl + spacing.xl },
  panel: { alignSelf: 'center', backgroundColor: colors.cream, flex: 1, marginTop: -spacing.xxl, maxWidth: 520, paddingBottom: spacing.xxl, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl + spacing.xl, width: '100%' },
  title: { color: colors.ink, fontSize: type.hero + spacing.sm, fontWeight: '900', letterSpacing: -1 },
  description: { color: colors.muted, fontSize: type.body, lineHeight: type.title + spacing.xs, marginBottom: spacing.xl, marginTop: spacing.sm },
  fieldGroup: { marginBottom: spacing.lg },
  label: { color: colors.ink, fontSize: type.body, fontWeight: '800', marginBottom: spacing.sm },
  inputShell: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', minHeight: spacing.xxxl + spacing.xxl, paddingHorizontal: spacing.lg },
  inputShellFocused: { backgroundColor: '#FFFCF4', borderColor: colors.mustardDark },
  input: { color: colors.ink, flex: 1, fontSize: type.body, minHeight: spacing.xxxl + spacing.xxl, paddingVertical: spacing.md },
  visibilityButton: { alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm, minHeight: 44, minWidth: 44 },
  error: { color: colors.red, fontSize: type.label, marginBottom: spacing.md },
  message: { color: colors.green, fontSize: type.label, lineHeight: type.title, marginBottom: spacing.md },
  primary: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.pill, justifyContent: 'center', minHeight: spacing.xxxl + spacing.xxl, paddingHorizontal: spacing.xl, ...shadow },
  primaryPressed: { opacity: 0.72 },
  primaryText: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  secondary: { alignItems: 'center', justifyContent: 'center', minHeight: spacing.xxxl + spacing.xl, paddingHorizontal: spacing.sm, paddingTop: spacing.md },
  switchText: { color: colors.ink, fontSize: type.body, fontWeight: '800', textAlign: 'center' },
  switchAction: { color: colors.orange, fontWeight: '900' },
  ownerContact: { alignItems: 'center', paddingBottom: spacing.sm, paddingHorizontal: spacing.lg },
  ownerContactText: { color: colors.muted, fontSize: type.label, textAlign: 'center' },
  ownerContactLink: { color: colors.orange, fontWeight: '900' },
  ownerContactNote: { color: colors.muted, fontSize: type.tiny, lineHeight: 18, marginTop: spacing.sm, textAlign: 'center' },
});
