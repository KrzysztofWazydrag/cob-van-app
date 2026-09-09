import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  profileState: { error: null as string | null, loading: false, reload: vi.fn(), profile: { displayName: 'Kris', role: 'customer', workplaceId: 'workplace-1' as string | null, workplaceName: 'ACERO' as string | null } },
  listener: null as null | ((event: string, session: unknown) => void),
  appStateListener: null as null | ((state: string) => void),
  auth: {
    getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(),
    signInWithPassword: vi.fn(), signUp: vi.fn(), startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn(),
  },
  unsubscribe: vi.fn(), remove: vi.fn(),
  openURL: vi.fn(),
}));
vi.mock('../src/lib/supabase', () => ({ supabase: { auth: mocks.auth, rpc: mocks.rpc } }));
vi.mock('../src/auth/useCurrentProfile', () => ({ useCurrentProfile: () => mocks.profileState }));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator', ImageBackground: 'ImageBackground', Pressable: 'Pressable', Text: 'Text', View: 'View',
  KeyboardAvoidingView: 'KeyboardAvoidingView', ScrollView: 'ScrollView', TextInput: 'TextInput',
  StyleSheet: { create: (styles: unknown) => styles }, Platform: { OS: 'ios' },
  AppState: { currentState: 'active', addEventListener: (_event: string, fn: typeof mocks.appStateListener) => { mocks.appStateListener = fn; return { remove: mocks.remove }; } },
  Linking: { openURL: mocks.openURL },
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView', SafeAreaProvider: 'SafeAreaProvider' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('@expo/vector-icons/Feather', () => ({ default: 'Feather' }));
vi.mock('../src/screens/CustomerScreen', () => ({ CustomerScreen: ({ displayName, onOpenDriverPreview }: { displayName: string; onOpenDriverPreview: () => void }) => React.createElement('Pressable', { onPress: onOpenDriverPreview }, React.createElement('Text', {}, 'Customer prototype'), React.createElement('Text', {}, `Morning, ${displayName}`)) }));
vi.mock('../src/screens/DriverScreen', () => ({ DriverScreen: ({ onRolePress }: { onRolePress: () => void }) => React.createElement('Pressable', { onPress: onRolePress }, React.createElement('Text', {}, 'Driver prototype')) }));
vi.mock('../src/notifications', () => ({ notifyVanArrived: vi.fn() }));
import App from '../App';
import { AuthGate } from '../src/auth/AuthGate';
import { AuthScreen } from '../src/screens/AuthScreen';

let tree: ReturnType<typeof create>;
const session = { user: { id: 'customer-1' }, access_token: 'test-token' };
const authenticatedChild = ({ signOut, signOutError }: { signOut: () => Promise<void>; signOutError: string | null }) => React.createElement(
  React.Fragment,
  {},
  React.createElement('Text', {}, 'Existing prototype'),
  React.createElement('Pressable', { onPress: signOut }, React.createElement('Text', {}, 'Log out')),
  signOutError ? React.createElement('Text', {}, signOutError) : null,
);
const text = () => JSON.stringify(tree.toJSON());
const press = async (label: string) => {
  const button = tree.root.findAllByType('Pressable' as never).find((node) => node.findAllByType('Text' as never).some((child) => String(child.props.children).includes(label)));
  if (!button) throw new Error(`Missing button: ${label}`);
  await act(async () => { await button.props.onPress(); });
};
const fill = async (label: string, value: string) => {
  await act(async () => tree.root.findByProps({ accessibilityLabel: label }).props.onChangeText(value));
};

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks();
  mocks.profileState.error = null;
  mocks.profileState.loading = false;
  mocks.profileState.profile.workplaceId = 'workplace-1';
  mocks.profileState.profile.workplaceName = 'ACERO';
  mocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.onAuthStateChange.mockImplementation((listener) => {
    mocks.listener = listener;
    return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
  });
  mocks.openURL.mockResolvedValue(undefined);
});
afterEach(async () => { if (tree) await act(async () => tree.unmount()); });

test('waits for storage, restores a session, logs out and requires sign in on remount', async () => {
  let restore: (value: unknown) => void = () => {};
  mocks.auth.getSession.mockReturnValueOnce(new Promise((resolve) => { restore = resolve; }));
  await act(async () => { tree = create(<AuthGate>{authenticatedChild}</AuthGate>); });
  expect(text()).toContain('Restoring your session');
  expect(text()).not.toContain('Welcome back');
  await act(async () => restore({ data: { session }, error: null }));
  expect(text()).toContain('Existing prototype');
  expect(mocks.auth.startAutoRefresh).toHaveBeenCalled();
  await act(async () => mocks.appStateListener?.('background'));
  expect(mocks.auth.stopAutoRefresh).toHaveBeenCalled();
  mocks.auth.signOut.mockImplementation(async () => {
    mocks.listener?.('SIGNED_OUT', null);
    return { error: null };
  });
  await press('Log out');
  expect(mocks.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(text()).toContain('Welcome back');
  expect(text()).not.toContain('Existing prototype');
  await act(async () => tree.unmount());
  expect(mocks.unsubscribe).toHaveBeenCalled();
  expect(mocks.remove).toHaveBeenCalled();
  await act(async () => { tree = create(<AuthGate>{authenticatedChild}</AuthGate>); });
  expect(text()).toContain('Welcome back');
});

test('auth events enter the prototype and session invalidation returns to authentication', async () => {
  await act(async () => { tree = create(<AuthGate>{authenticatedChild}</AuthGate>); });
  await act(async () => mocks.listener?.('SIGNED_IN', session));
  expect(text()).toContain('Existing prototype');
  await act(async () => mocks.listener?.('SIGNED_OUT', null));
  expect(text()).toContain('Welcome back');
});

test('failed logout keeps the app open and reports the error', async () => {
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.auth.signOut.mockResolvedValue({ error: { message: 'Network unavailable' } });
  await act(async () => { tree = create(<AuthGate>{authenticatedChild}</AuthGate>); });
  await press('Log out');
  expect(text()).toContain('Existing prototype');
  expect(text()).toContain('Network unavailable');
});

test('sign in submits email/password and shows authentication errors', async () => {
  mocks.auth.signInWithPassword.mockResolvedValue({ error: new Error('Invalid credentials') });
  await act(async () => { tree = create(<AuthScreen client={{ auth: mocks.auth } as any} />); });
  await fill('Email', ' user@example.com ');
  await fill('Password', 'password123');
  await press('Sign in');
  expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
  expect(text()).toContain('Invalid credentials');
});

test('password visibility can be toggled without changing the password', async () => {
  await act(async () => { tree = create(<AuthScreen client={{ auth: mocks.auth } as any} />); });
  await fill('Password', 'password123');
  expect(tree.root.findByProps({ accessibilityLabel: 'Password' }).props.secureTextEntry).toBe(true);
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Show password' }).props.onPress());
  expect(tree.root.findByProps({ accessibilityLabel: 'Password' }).props.secureTextEntry).toBe(false);
  expect(tree.root.findByProps({ accessibilityLabel: 'Password' }).props.value).toBe('password123');
});

test('sign up supplies display name and handles email confirmation without a session', async () => {
  mocks.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  await act(async () => { tree = create(<AuthScreen client={{ auth: mocks.auth } as any} />); });
  await press('New to Cob Van');
  expect(text()).toContain('Are you a van owner?');
  await press('Are you a van owner?');
  expect(text()).toContain('Owner accounts are set up manually');
  expect(mocks.openURL).toHaveBeenCalledWith('mailto:sitecrew.cc@gmail.com?subject=Cob%20Van%20owner%20onboarding');
  await fill('Display name', ' Kris ');
  await fill('Email', 'jamie@example.com');
  await fill('Password', 'password123');
  await press('Create account');
  expect(mocks.auth.signUp).toHaveBeenCalledWith({
    email: 'jamie@example.com',
    password: 'password123',
    options: { data: { display_name: 'Kris' }, emailRedirectTo: 'cobvan://auth/callback' },
  });
  expect(text()).toContain('Check your email to confirm your account, then return to Cob Van to sign in.');
  expect(tree.root.findByProps({ accessibilityLabel: 'Password' }).props.value).toBe('');
});


test('App opens the customer prototype after authentication and preserves the driver switch', async () => {
  await act(async () => { tree = create(<App />); });
  expect(text()).toContain('Welcome back');
  expect(text()).not.toContain('Customer prototype');
  await act(async () => mocks.listener?.('SIGNED_IN', session));
  expect(text()).toContain('Customer prototype');
  expect(text()).toContain('Morning, Kris');
  await press('Customer prototype');
  expect(text()).toContain('Driver prototype');
  await press('Driver prototype');
  expect(text()).toContain('Customer prototype');
});


test('customer without membership must join, validates errors, then reloads the persisted profile', async () => {
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.profileState.profile.workplaceId = null;
  mocks.profileState.profile.workplaceName = null;
  await act(async () => { tree = create(<App />); });
  expect(text()).toContain('Join your workplace');
  expect(text()).not.toContain('Customer prototype');
  await press('Join workplace');
  expect(text()).toContain('Enter your workplace code.');
  expect(mocks.rpc).not.toHaveBeenCalled();
  await fill('Workplace code', 'BAD');
  mocks.rpc.mockResolvedValueOnce({ error: { code: 'P0001' } });
  await press('Join workplace');
  expect(text()).toContain("We couldn't find that workplace code.");
  expect(mocks.profileState.reload).not.toHaveBeenCalled();
  mocks.rpc.mockRejectedValueOnce(new Error('Offline'));
  await press('Join workplace');
  expect(text()).toContain('Check your connection');
  await fill('Workplace code', '  ACERO123  ');
  mocks.rpc.mockResolvedValueOnce({ error: null });
  await press('Join workplace');
  expect(mocks.rpc).toHaveBeenLastCalledWith('join_workplace', { workplace_code: 'ACERO123' });
  expect(mocks.profileState.reload).toHaveBeenCalledOnce();
  mocks.profileState.profile.workplaceId = 'workplace-1';
  mocks.profileState.profile.workplaceName = 'ACERO';
  await act(async () => tree.update(<App />));
  expect(text()).toContain('Customer prototype');
  expect(text()).not.toContain('Join your workplace');
});

test('profile loading and failures block onboarding and customer content with retry available', async () => {
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.profileState.loading = true;
  await act(async () => { tree = create(<App />); });
  expect(text()).toContain('Loading your profile');
  expect(text()).not.toContain('Join your workplace');
  expect(text()).not.toContain('Customer prototype');
  mocks.profileState.loading = false;
  mocks.profileState.error = 'Profile details are temporarily unavailable.';
  await act(async () => tree.update(<App />));
  expect(text()).toContain('temporarily unavailable');
  await press('Try again');
  expect(mocks.profileState.reload).toHaveBeenCalledOnce();
  expect(text()).not.toContain('Customer prototype');
});
