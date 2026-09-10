import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onOpenDriverPreview: vi.fn(),
  onReserve: vi.fn(),
  onSignOut: vi.fn(),
}));

vi.mock('react-native', () => ({
  ImageBackground: 'ImageBackground', Modal: 'Modal', Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View',
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ bottom: 0 }) }));
vi.mock('@expo/vector-icons/Feather', () => ({ default: 'Feather' }));
vi.mock('../src/components/FoodImage', () => ({ FoodImage: () => React.createElement('FoodImage') }));
vi.mock('../src/components/BuildYourOwnModal', () => ({ BuildYourOwnModal: ({ visible }: { visible: boolean }) => visible ? React.createElement('Text', {}, 'Build your own open') : null }));

import { initialBuildYourOwnPricing, initialInventory, orders, products } from '../src/data';
vi.mock('../src/components/VanMap', async () => import('../src/components/VanMap.web'));

import { VanTrackingModal } from '../src/components/VanTrackingModal';
import { CustomerScreen } from '../src/screens/CustomerScreen';

test('customer navigation and reservation work without unsupported cutoff or expiry claims', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).__DEV__ = true;
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(
      <CustomerScreen
        buildPricing={initialBuildYourOwnPricing}
        displayName="Kris"
        inventory={initialInventory}
        onOpenDriverPreview={mocks.onOpenDriverPreview}
        onReserve={mocks.onReserve}
        onSignOut={mocks.onSignOut}
        orders={orders}
        products={products}
        profile={{ displayName: 'Kris', role: 'customer', workplaceId: 'workplace-1', workplaceName: 'ACERO' }}
        profileError={null}
        signOutError={null}
        signingOut={false}
        stopMode={false}
        user={{ id: 'customer-1', email: 'jamie@example.com', user_metadata: { display_name: 'Jamie' } } as any}
      />,
    );
  });

  const renderedText = () => JSON.stringify(tree.toJSON());
  const expectNoDeadlineClaims = () => {
    expect(renderedText()).not.toMatch(/9:45|minutes left to reserve|held for 10 minutes|reservations? expir/i);
  };
  const pressText = async (label: string) => {
    const button = tree.root.findAllByType('Pressable' as never).find((node) => node.findAllByType('Text' as never).some((child) => String(child.props.children).includes(label)));
    if (!button) throw new Error(`Missing button: ${label}`);
    await act(async () => button.props.onPress());
  };

  expect(tree.root.findAllByType('Text' as never).some((node) => Array.isArray(node.props.children) && node.props.children.join('') === 'Morning, Kris')).toBe(true);
  expect(renderedText()).toContain('Home');
  expect(renderedText()).toContain('In the van');
  expect(renderedText()).toContain('Orders');
  expect(renderedText()).toContain('Profile');
  expect(renderedText()).toContain('Reserve from the menu');
  expect(renderedText()).toContain('Browse available food for');
  expectNoDeadlineClaims();
  expect(renderedText()).not.toContain('Favourites');
  expect(tree.root.findAllByProps({ accessibilityLabel: 'Switch to van crew view' })).toHaveLength(0);

  await pressText('In the van');
  expect(renderedText()).toContain('READY RIGHT NOW');
  expect(renderedText()).toContain('available');
  expect(renderedText()).not.toContain('available to reserve');
  expect(renderedText()).not.toContain(' in van · ');
  await pressText('Orders');
  expect(renderedText()).toContain('Your orders');
  expect(renderedText()).toContain('No orders yet');
  expect(renderedText()).not.toContain('ORDER #');
  await pressText('Profile');
  expect(renderedText()).toContain('Kris');
  expect(renderedText()).toContain('jamie@example.com');
  expect(renderedText()).toContain('ACERO');
  await pressText('Log out');
  expect(mocks.onSignOut).toHaveBeenCalledOnce();
  await pressText('Open van crew view');
  expect(mocks.onOpenDriverPreview).toHaveBeenCalledOnce();

  await pressText('Home');
  expect(renderedText()).toContain('Order ahead');
  const product = products.find((item) => item.id === 'bacon-egg')!;
  await act(async () => tree.root.findByProps({ accessibilityLabel: `Choose ${product.name}, £${product.price.toFixed(2)}` }).props.onPress());
  expect(renderedText()).toContain('No payment now');
  expectNoDeadlineClaims();
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Increase quantity' }).props.onPress());
  await pressText('Red sauce');
  await pressText('Reserve mine');
  expect(mocks.onReserve).toHaveBeenCalledOnce();
  expect(mocks.onReserve).toHaveBeenCalledWith(product, 2, 'Red sauce');
  expect(renderedText()).toContain('Your food is reserved');
  expectNoDeadlineClaims();
  const trackingButton = tree.root.findAllByType('Pressable' as never).find((node) => node.props.accessibilityLabel === 'Open tracking demo');
  expect(trackingButton).toBeDefined();
  await act(async () => trackingButton?.props.onPress());
  expect(tree.root.findByType(VanTrackingModal).props.visible).toBe(true);
  expect(renderedText()).toContain('TRACKING DEMO');
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Close van tracking' }).props.onPress());
  expect(tree.root.findByType(VanTrackingModal).props.visible).toBe(false);

  await act(async () => tree.unmount());
});

test.each([
  ['00000000-0000-4000-8000-000000000001', 'Jamie P.', 'First UUID order', 'Second UUID order'],
  ['00000000-0000-4000-8000-000000000002', 'Jamie P.', 'Second UUID order', 'First UUID order'],
  ['00000000-0000-4000-8000-000000000001', 'Renamed customer', 'First UUID order', 'Second UUID order'],
])('order history uses UUID %s regardless of display name %s', async (userId, displayName, ownItem, otherItem) => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('__DEV__', false);
  const localOrders = [
    ...orders,
    { ...orders[0], id: 'local-first', customerId: '00000000-0000-4000-8000-000000000001', itemName: 'First UUID order' },
    { ...orders[0], id: 'local-second', customerId: '00000000-0000-4000-8000-000000000002', itemName: 'Second UUID order' },
  ];
  let tree!: ReturnType<typeof create>;
  try {
    await act(async () => {
      tree = create(<CustomerScreen
        buildPricing={initialBuildYourOwnPricing}
        displayName={displayName}
        inventory={initialInventory}
        onOpenDriverPreview={mocks.onOpenDriverPreview}
        onReserve={mocks.onReserve}
        onSignOut={mocks.onSignOut}
        orders={localOrders}
        products={products}
        profile={{ displayName, role: 'customer', workplaceId: 'workplace-1', workplaceName: 'ACERO' }}
        profileError={null}
        signOutError={null}
        signingOut={false}
        stopMode={false}
        user={{ id: userId } as any}
      />);
    });
    const ordersTab = tree.root.findAllByProps({ accessibilityRole: 'tab' }).find((node) =>
      node.findAllByType('Text' as never).some((child) => child.props.children === 'Orders'))!;
    await act(async () => ordersTab.props.onPress());
    const rendered = JSON.stringify(tree.toJSON());
    expect(rendered).toContain(ownItem);
    expect(rendered).not.toContain(otherItem);
    expect(rendered).not.toContain(orders[0].itemName);
    expect(rendered).not.toContain('No orders yet');
  } finally {
    if (tree) await act(async () => tree.unmount());
    vi.unstubAllGlobals();
  }
});
