import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  appStateListener: null as null | ((state: string) => void),
  auth: {
    getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(),
    signInWithPassword: vi.fn(), signUp: vi.fn(), startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn(),
  },
  unsubscribe: vi.fn(), remove: vi.fn(),
}));
vi.mock('../src/lib/supabase', () => ({ supabase: { auth: mocks.auth } }));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator', ImageBackground: 'ImageBackground', Pressable: 'Pressable', Text: 'Text', View: 'View',
  KeyboardAvoidingView: 'KeyboardAvoidingView', ScrollView: 'ScrollView', TextInput: 'TextInput',
  StyleSheet: { create: (styles: unknown) => styles }, Platform: { OS: 'ios' },
  AppState: { currentState: 'active', addEventListener: (_event: string, fn: typeof mocks.appStateListener) => { mocks.appStateListener = fn; return { remove: mocks.remove }; } },
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView', SafeAreaProvider: 'SafeAreaProvider' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('../src/screens/CustomerScreen', () => ({ CustomerScreen: ({ onRolePress }: { onRolePress: () => void }) => React.createElement('Pressable', { onPress: onRolePress }, React.createElement('Text', {}, 'Customer prototype')) }));
vi.mock('../src/screens/DriverScreen', () => ({ DriverScreen: ({ onRolePress }: { onRolePress: () => void }) => React.createElement('Pressable', { onPress: onRolePress }, React.createElement('Text', {}, 'Driver prototype')) }));
vi.mock('../src/notifications', () => ({ notifyVanArrived: vi.fn() }));
import App from '../App';
import { AuthGate } from '../src/auth/AuthGate';
import { AuthScreen } from '../src/screens/AuthScreen';

let tree: ReturnType<typeof create>;
const session = { user: { id: 'customer-1' }, access_token: 'test-token' };
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
  mocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.onAuthStateChange.mockImplementation((listener) => {
    mocks.listener = listener;
    return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
  });
});
afterEach(async () => { if (tree) await act(async () => tree.unmount()); });

test('waits for storage, restores a session, logs out and requires sign in on remount', async () => {
  let restore: (value: unknown) => void = () => {};
  mocks.auth.getSession.mockReturnValueOnce(new Promise((resolve) => { restore = resolve; }));
  await act(async () => { tree = create(<AuthGate><React.Fragment>Existing prototype</React.Fragment></AuthGate>); });
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
  await act(async () => { tree = create(<AuthGate>Existing prototype</AuthGate>); });
  expect(text()).toContain('Welcome back');
});

test('auth events enter the prototype and session invalidation returns to authentication', async () => {
  await act(async () => { tree = create(<AuthGate>Existing prototype</AuthGate>); });
  await act(async () => mocks.listener?.('SIGNED_IN', session));
  expect(text()).toContain('Existing prototype');
  await act(async () => mocks.listener?.('SIGNED_OUT', null));
  expect(text()).toContain('Welcome back');
});

test('failed logout keeps the app open and reports the error', async () => {
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.auth.signOut.mockResolvedValue({ error: { message: 'Network unavailable' } });
  await act(async () => { tree = create(<AuthGate>Existing prototype</AuthGate>); });
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

test('sign up supplies display name and handles email confirmation without a session', async () => {
  mocks.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  await act(async () => { tree = create(<AuthScreen client={{ auth: mocks.auth } as any} />); });
  await press('New to Cob Van');
  await fill('Display name', ' Jamie ');
  await fill('Email', 'jamie@example.com');
  await fill('Password', 'password123');
  await press('Create account');
  expect(mocks.auth.signUp).toHaveBeenCalledWith({ email: 'jamie@example.com', password: 'password123', options: { data: { display_name: 'Jamie' } } });
  expect(text()).toContain('Check your email');
  expect(tree.root.findByProps({ accessibilityLabel: 'Password' }).props.value).toBe('');
});


test('App opens the customer prototype after authentication and preserves the driver switch', async () => {
  await act(async () => { tree = create(<App />); });
  expect(text()).toContain('Welcome back');
  expect(text()).not.toContain('Customer prototype');
  await act(async () => mocks.listener?.('SIGNED_IN', session));
  expect(text()).toContain('Customer prototype');
  await press('Customer prototype');
  expect(text()).toContain('Driver prototype');
  await press('Driver prototype');
  expect(text()).toContain('Customer prototype');
});
