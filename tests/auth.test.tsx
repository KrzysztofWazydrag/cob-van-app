import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  platform: { OS: 'ios' },
  backListener: null as null | (() => boolean),
  removeBackListener: vi.fn(),
  addBackListener: vi.fn(),
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
  Modal: 'Modal', Switch: 'Switch', ActivityIndicator: 'ActivityIndicator', ImageBackground: 'ImageBackground', Pressable: 'Pressable', Text: 'Text', View: 'View',
  KeyboardAvoidingView: 'KeyboardAvoidingView', ScrollView: 'ScrollView', TextInput: 'TextInput',
  StyleSheet: { create: (styles: unknown) => styles }, Platform: mocks.platform,
  BackHandler: { addEventListener: mocks.addBackListener },
  AppState: { currentState: 'active', addEventListener: (_event: string, fn: typeof mocks.appStateListener) => { mocks.appStateListener = fn; return { remove: mocks.remove }; } },
  Linking: { openURL: mocks.openURL },
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView', SafeAreaProvider: 'SafeAreaProvider' }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('@expo/vector-icons/Feather', () => ({ default: 'Feather' }));
vi.mock('../src/screens/CustomerScreen', () => ({ CustomerScreen: ({ displayName, onOpenDriverPreview }: { displayName: string; onOpenDriverPreview: () => void }) => React.createElement('Pressable', { onPress: onOpenDriverPreview }, React.createElement('Text', {}, 'Customer prototype'), React.createElement('Text', {}, `Morning, ${displayName}`)) }));
vi.mock('../src/notifications', () => ({ notifyVanArrived: vi.fn() }));
import App from '../App';
import { AuthGate } from '../src/auth/AuthGate';
import { AuthScreen } from '../src/screens/AuthScreen';
import { DriverScreen } from '../src/screens/DriverScreen';
import { CustomerScreen } from '../src/screens/CustomerScreen';
import { orders as fixtureOrders, products } from '../src/data';

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
  mocks.platform.OS = 'ios';
  mocks.backListener = null;
  mocks.addBackListener.mockImplementation((_event: string, listener: () => boolean) => {
    mocks.backListener = listener;
    return { remove: mocks.removeBackListener };
  });
  mocks.removeBackListener.mockImplementation(() => { mocks.backListener = null; });
  vi.stubGlobal('__DEV__', false);
  mocks.profileState.profile.role = 'customer';
  mocks.profileState.profile.displayName = 'Kris';
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
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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


test('DEV preview can switch between customer and crew without changing the profile role', async () => {
  vi.stubGlobal('__DEV__', true);
  await act(async () => { tree = create(<App />); });
  expect(text()).toContain('Welcome back');
  expect(text()).not.toContain('Customer prototype');
  await act(async () => mocks.listener?.('SIGNED_IN', session));
  expect(text()).toContain('Customer prototype');
  expect(text()).toContain('Morning, Kris');
  await press('Customer prototype');
  expect(text()).toContain('Next stop');
  expect(mocks.profileState.profile.role).toBe('customer');
  await press('DEV · CUSTOMER');
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


test.each(['customer', 'owner', 'driver'])('production routes the %s profile and ignores preview callbacks', async (role) => {
  mocks.profileState.profile.role = role;
  mocks.profileState.profile.workplaceId = role === 'customer' ? 'workplace-1' : null;
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  await act(async () => { tree = create(<App />); });
  if (role === 'customer') {
    expect(text()).toContain('Customer prototype');
    await press('Customer prototype'); // Invoke even a callback that the production Profile hides.
    expect(text()).toContain('Customer prototype');
    expect(text()).not.toContain('Next stop');
  } else {
    expect(text()).toContain('Next stop');
    expect(text()).not.toContain('Customer prototype');
    expect(text()).not.toContain('Join your workplace');
    expect(text()).not.toContain('DEV · CUSTOMER');
    expect(text()).toContain('Log out');
  }
});

test('workplace membership and privileged metadata do not grant staff navigation', async () => {
  mocks.profileState.profile.displayName = 'Owner';
  mocks.profileState.profile.workplaceId = null;
  mocks.auth.getSession.mockResolvedValue({ data: { session: {
    ...session, user: { ...session.user, user_metadata: { role: 'owner' } },
  } }, error: null });
  await act(async () => { tree = create(<App />); });
  expect(text()).toContain('Join your workplace');
  mocks.profileState.profile.workplaceId = 'staff-looking-workplace';
  await act(async () => tree.update(<App />));
  expect(text()).toContain('Customer prototype');
  await press('Customer prototype');
  expect(text()).not.toContain('Next stop');
});

test('production ignores an existing DEV preview override and follows profile changes', async () => {
  vi.stubGlobal('__DEV__', true);
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  await act(async () => { tree = create(<App />); });
  await press('Customer prototype');
  expect(text()).toContain('Next stop');
  vi.stubGlobal('__DEV__', false);
  await act(async () => tree.update(<App />));
  expect(text()).toContain('Customer prototype');
  mocks.profileState.profile.role = 'owner';
  await act(async () => tree.update(<App />));
  expect(text()).toContain('Next stop');
  mocks.profileState.profile.role = 'customer';
  await act(async () => tree.update(<App />));
  expect(text()).toContain('Customer prototype');
});

test.each(['admin', '', null])('unexpected role %s blocks both app screens and retains retry/logout', async (role) => {
  mocks.profileState.profile.role = role as unknown as string;
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  await act(async () => { tree = create(<App />); });
  expect(text()).toContain('Your account role is not supported');
  expect(text()).not.toContain('Customer prototype');
  expect(text()).not.toContain('Next stop');
  await press('Try again');
  expect(mocks.profileState.reload).toHaveBeenCalledOnce();
  mocks.auth.signOut.mockImplementation(async () => {
    mocks.listener?.('SIGNED_OUT', null);
    return { error: null };
  });
  await press('Log out');
  expect(text()).toContain('Welcome back');
});

test.each(['owner', 'driver'])('%s entry waits for profile and supports logout failure, busy state and retry', async (role) => {
  mocks.profileState.profile.role = role;
  mocks.profileState.loading = true;
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  await act(async () => { tree = create(<App />); });
  expect(text()).not.toContain('Next stop');
  expect(text()).not.toContain('Customer prototype');
  mocks.profileState.loading = false;
  mocks.profileState.error = 'Profile unavailable';
  await act(async () => tree.update(<App />));
  expect(text()).not.toContain('Next stop');
  expect(text()).not.toContain('Customer prototype');
  mocks.profileState.error = null;
  await act(async () => tree.update(<App />));
  expect(text()).toContain('Next stop');
  mocks.auth.signOut.mockResolvedValueOnce({ error: { message: 'Network unavailable' } });
  await press('Log out');
  expect(text()).toContain('Network unavailable');
  expect(text()).toContain('Next stop');
  let finishLogout!: () => void;
  mocks.auth.signOut.mockImplementationOnce(() => new Promise((resolve) => {
    finishLogout = () => { mocks.listener?.('SIGNED_OUT', null); resolve({ error: null }); };
  }));
  const button = tree.root.findAllByType('Pressable' as never).find((node) => node.findAllByType('Text' as never).some((child) => child.props.children === 'Log out'))!;
  let pending!: Promise<void>;
  await act(async () => { pending = button.props.onPress(); });
  expect(button.props.disabled).toBe(true);
  expect(text()).toContain('Logging out');
  await act(async () => { finishLogout(); await pending; });
  expect(mocks.auth.signOut).toHaveBeenLastCalledWith({ scope: 'local' });
  expect(text()).toContain('Welcome back');
});

test('local reservation records the authenticated UUID and crew retains fixture operations', async () => {
  vi.stubGlobal('__DEV__', true);
  const userId = '00000000-0000-4000-8000-000000000001';
  mocks.auth.getSession.mockResolvedValue({ data: { session: {
    ...session, user: { id: userId },
  } }, error: null });
  await act(async () => { tree = create(<App />); });
  const product = products.find((item) => item.id === 'bacon-egg')!;
  await act(async () => tree.root.findByType(CustomerScreen).props.onReserve(product, 1, 'No sauce'));
  const customerProps = tree.root.findByType(CustomerScreen).props;
  expect(customerProps.orders[0]).toMatchObject({
    customerId: userId, customer: 'Kris', productId: product.id, quantity: 1,
  });
  expect(customerProps.orders.slice(1)).toEqual(fixtureOrders);
  await press('Customer prototype');
  expect(text()).toContain('Next stop');
  for (const order of fixtureOrders) expect(text()).toContain(order.customer);
  const handover = tree.root.findByProps({ accessibilityLabel: 'Hand over for order 104' });
  await act(async () => handover.props.onPress());
  expect(tree.root.findByProps({ accessibilityLabel: 'Collected for order 104' }).props.disabled).toBe(true);
});


async function openLocalCustomer() {
  vi.stubGlobal('__DEV__', true);
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  await act(async () => { tree = create(<App />); });
  return tree.root.findByType(CustomerScreen).props;
}

test('reservation creates one order and reserves exactly the requested quantity', async () => {
  const before = await openLocalCustomer();
  const product = products.find((item) => item.id === 'bacon-egg')!;
  await act(async () => before.onReserve(product, 2, 'No sauce'));
  const after = tree.root.findByType(CustomerScreen).props;
  expect(after.orders).toHaveLength(before.orders.length + 1);
  expect(after.orders[0]).toMatchObject({ productId: product.id, quantity: 2, customerId: session.user.id });
  expect(after.inventory[product.id]).toEqual({ ...before.inventory[product.id], reserved: before.inventory[product.id].reserved + 2 });
});

test.each([100, 0, -1, 1.5, NaN])('unreservable quantity %s leaves orders and stock unchanged', async (quantity) => {
  const before = await openLocalCustomer();
  await act(async () => before.onReserve(products[1], quantity, 'No sauce'));
  const after = tree.root.findByType(CustomerScreen).props;
  expect(after.orders).toEqual(before.orders);
  expect(after.inventory).toEqual(before.inventory);
});

test('batched reservations cannot create orders beyond reservable stock', async () => {
  const before = await openLocalCustomer();
  const product = products.find((item) => item.id === 'full-english')!;
  await act(async () => {
    before.onReserve(product, 2, 'No sauce');
    before.onReserve(product, 2, 'No sauce');
  });
  const after = tree.root.findByType(CustomerScreen).props;
  expect(after.orders).toHaveLength(before.orders.length + 1);
  expect(after.inventory[product.id]).toEqual({ ...before.inventory[product.id], reserved: before.inventory[product.id].reserved + 2 });
});

test('successful reservations in the same millisecond have distinct IDs', async () => {
  const before = await openLocalCustomer();
  vi.spyOn(Date, 'now').mockReturnValue(123456789);
  await act(async () => {
    before.onReserve(products[1], 1, 'No sauce');
    before.onReserve(products[1], 1, 'Brown sauce');
  });
  const after = tree.root.findByType(CustomerScreen).props;
  expect(after.orders).toHaveLength(before.orders.length + 2);
  expect(new Set(after.orders.map((order: { id: string }) => order.id)).size).toBe(after.orders.length);
  expect(after.inventory[products[1].id].reserved).toBe(before.inventory[products[1].id].reserved + 2);
});

test('duplicate handovers deduct once and unrelated orders still advance', async () => {
  await openLocalCustomer();
  await press('Customer prototype');
  const before = tree.root.findByType(DriverScreen).props;
  const handover = before.onAdvanceOrder;
  await act(async () => { handover('1'); handover('1'); });
  const after = tree.root.findByType(DriverScreen).props;
  expect(after.orders.find((order: { id: string }) => order.id === '1').status).toBe('collected');
  expect(after.inventory['bacon-egg']).toEqual({ ...before.inventory['bacon-egg'], physical: 7, reserved: 0 });
  await act(async () => { handover('1'); after.onAdvanceOrder('1'); after.onAdvanceOrder('missing'); });
  expect(tree.root.findByType(DriverScreen).props.inventory).toEqual(after.inventory);
  await act(async () => tree.root.findByType(DriverScreen).props.onAdvanceOrder('2'));
  const other = tree.root.findByType(DriverScreen).props;
  expect(other.orders.find((order: { id: string }) => order.id === '2').status).toBe('collected');
  expect(other.inventory['sausage-egg']).toEqual({ ...before.inventory['sausage-egg'], physical: 10, reserved: 0 });
});

test('repeated made-to-order callbacks cannot skip preparation or undo collection', async () => {
  const customer = await openLocalCustomer();
  const product = products.find((item) => item.id === 'ham-cheese-toastie')!;
  await act(async () => customer.onReserve(product, 1, 'No sauce'));
  const id = tree.root.findByType(CustomerScreen).props.orders[0].id;
  await press('Customer prototype');
  const initial = tree.root.findByType(DriverScreen).props;
  const start = initial.onAdvanceOrder;
  await act(async () => { start(id); start(id); });
  expect(tree.root.findByType(DriverScreen).props.orders[0].status).toBe('preparing');
  await act(async () => start(id));
  expect(tree.root.findByType(DriverScreen).props.orders[0].status).toBe('preparing');
  for (const expected of ['ready', 'collected']) {
    const advance = tree.root.findByType(DriverScreen).props.onAdvanceOrder;
    await act(async () => { advance(id); advance(id); });
    expect(tree.root.findByType(DriverScreen).props.orders[0].status).toBe(expected);
  }
  const final = tree.root.findByType(DriverScreen).props;
  expect(final.inventory[product.id]).toEqual({ ...initial.inventory[product.id], physical: 5, reserved: 0 });
  await act(async () => start(id));
  expect(tree.root.findByType(DriverScreen).props.orders[0].status).toBe('collected');
  expect(tree.root.findByType(DriverScreen).props.inventory).toEqual(final.inventory);
});

test('walk-up sale and undo preserve orders and the local ID sequence', async () => {
  const customer = await openLocalCustomer();
  await act(async () => customer.onReserve(products[1], 1, 'No sauce'));
  const firstId = tree.root.findByType(CustomerScreen).props.orders[0].id;
  await press('Customer prototype');
  const before = tree.root.findByType(DriverScreen).props;
  await act(async () => before.onWalkUpSale('bacon-egg', 'Acero'));
  const sold = tree.root.findByType(DriverScreen).props;
  expect(sold.orders).toEqual(before.orders);
  expect(sold.inventory['bacon-egg'].physical).toBe(before.inventory['bacon-egg'].physical - 1);
  await act(async () => sold.onUndoWalkUpSale(sold.walkUpSales[0].id));
  const undone = tree.root.findByType(DriverScreen).props;
  expect(undone.inventory).toEqual(before.inventory);
  expect(undone.orders).toEqual(before.orders);
  await press('DEV · CUSTOMER');
  await act(async () => tree.root.findByType(CustomerScreen).props.onReserve(products[1], 1, 'No sauce'));
  const after = tree.root.findByType(CustomerScreen).props;
  expect(after.orders[0].id).not.toBe(firstId);
  expect(after.orders).toHaveLength(before.orders.length + 1);
});

test('Sign Up has a visible back action that returns to Sign In and retains email', async () => {
  await act(async () => { tree = create(<AuthScreen client={{ auth: mocks.auth } as any} />); });
  expect(tree.root.findAllByProps({ accessibilityLabel: 'Back to sign in' })).toHaveLength(0);
  await press('New to Cob Van');
  await fill('Email', 'user@example.com');
  await fill('Password', 'signup-password');
  const back = tree.root.findByProps({ accessibilityLabel: 'Back to sign in' });
  expect(back.props.accessibilityRole).toBe('button');
  await act(async () => back.props.onPress());
  expect(text()).toContain('Welcome back');
  expect(text()).not.toContain('Create your account');
  expect(tree.root.findByProps({ accessibilityLabel: 'Email' }).props.value).toBe('user@example.com');
  expect(tree.root.findByProps({ accessibilityLabel: 'Password' }).props.value).toBe('');
  expect(mocks.addBackListener).not.toHaveBeenCalled();
});

test('Android consumes back on Sign Up and removes its handler on Sign In and unmount', async () => {
  mocks.platform.OS = 'android';
  await act(async () => { tree = create(<AuthGate>{authenticatedChild}</AuthGate>); });
  expect(mocks.addBackListener).not.toHaveBeenCalled();
  await press('New to Cob Van');
  expect(mocks.addBackListener).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
  await act(async () => { expect(mocks.backListener?.()).toBe(true); });
  expect(text()).toContain('Welcome back');
  expect(text()).not.toContain('Create your account');
  expect(mocks.removeBackListener).toHaveBeenCalledOnce();
  expect(mocks.backListener).toBeNull();
  await press('New to Cob Van');
  await act(async () => tree.unmount());
  expect(mocks.removeBackListener).toHaveBeenCalledTimes(2);
  expect(mocks.backListener).toBeNull();
});

test('Android back during signup returns to Sign In without cancelling or repeating signup', async () => {
  mocks.platform.OS = 'android';
  let completeSignup!: (value: unknown) => void;
  mocks.auth.signUp.mockImplementationOnce(() => new Promise((resolve) => { completeSignup = resolve; }));
  await act(async () => { tree = create(<AuthScreen client={{ auth: mocks.auth } as any} />); });
  await press('New to Cob Van');
  await fill('Display name', 'Kris');
  await fill('Email', 'user@example.com');
  await fill('Password', 'signup-password');
  let pending!: Promise<void>;
  await act(async () => { pending = tree.root.findByProps({ accessibilityLabel: 'Password' }).props.onSubmitEditing(); });
  expect(text()).toContain('Please wait');
  await act(async () => { expect(mocks.backListener?.()).toBe(true); });
  expect(text()).toContain('Welcome back');
  expect(mocks.backListener).toBeNull();
  await act(async () => { completeSignup({ data: { session: null }, error: null }); await pending; });
  expect(mocks.auth.signUp).toHaveBeenCalledOnce();
  expect(text()).toContain('Check your email to confirm your account');
  expect(text()).toContain('Welcome back');
});
