import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onOpenDriverPreview: vi.fn(),
  onReserve: vi.fn(),
  onSignOut: vi.fn(),
  profileQuery: vi.fn().mockResolvedValue({
    data: { display_name: 'Jamie Parker', role: 'customer', workplace_id: null },
    error: null,
  }),
}));

vi.mock('react-native', () => ({
  ImageBackground: 'ImageBackground', Modal: 'Modal', Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View',
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ bottom: 0 }) }));
vi.mock('@expo/vector-icons/Feather', () => ({ default: 'Feather' }));
vi.mock('../src/components/FoodImage', () => ({ FoodImage: () => React.createElement('FoodImage') }));
vi.mock('../src/components/BuildYourOwnModal', () => ({ BuildYourOwnModal: ({ visible }: { visible: boolean }) => visible ? React.createElement('Text', {}, 'Build your own open') : null }));
vi.mock('../src/components/VanTrackingModal', () => ({ VanTrackingModal: ({ visible }: { visible: boolean }) => visible ? React.createElement('Text', {}, 'Tracking open') : null }));
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profileQuery }) }) }),
  },
}));

import { initialBuildYourOwnPricing, initialInventory, orders, products } from '../src/data';
import { CustomerScreen } from '../src/screens/CustomerScreen';

test('four-tab navigation exposes ready stock, orders and profile without an avatar role switch', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).__DEV__ = true;
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(
      <CustomerScreen
        buildPricing={initialBuildYourOwnPricing}
        inventory={initialInventory}
        onOpenDriverPreview={mocks.onOpenDriverPreview}
        onReserve={mocks.onReserve}
        onSignOut={mocks.onSignOut}
        orders={orders}
        products={products}
        signOutError={null}
        signingOut={false}
        stopMode={false}
        user={{ id: 'customer-1', email: 'jamie@example.com', user_metadata: { display_name: 'Jamie' } } as any}
      />,
    );
  });

  const renderedText = () => JSON.stringify(tree.toJSON());
  const pressText = async (label: string) => {
    const button = tree.root.findAllByType('Pressable' as never).find((node) => node.findAllByType('Text' as never).some((child) => String(child.props.children).includes(label)));
    if (!button) throw new Error(`Missing button: ${label}`);
    await act(async () => button.props.onPress());
  };

  expect(renderedText()).toContain('Home');
  expect(renderedText()).toContain('In the van');
  expect(renderedText()).toContain('Orders');
  expect(renderedText()).toContain('Profile');
  expect(renderedText()).not.toContain('Favourites');
  expect(tree.root.findAllByProps({ accessibilityLabel: 'Switch to van crew view' })).toHaveLength(0);

  await pressText('In the van');
  expect(renderedText()).toContain('READY RIGHT NOW');
  expect(renderedText()).toContain('available');
  expect(renderedText()).not.toContain('available to reserve');
  expect(renderedText()).not.toContain(' in van · ');
  await pressText('Orders');
  expect(renderedText()).toContain('Your orders');
  await pressText('Profile');
  expect(renderedText()).toContain('Jamie Parker');
  expect(renderedText()).toContain('jamie@example.com');
  expect(renderedText()).toContain('Not assigned');
  await pressText('Log out');
  expect(mocks.onSignOut).toHaveBeenCalledOnce();
  await pressText('Open van crew view');
  expect(mocks.onOpenDriverPreview).toHaveBeenCalledOnce();

  await pressText('Home');
  expect(renderedText()).toContain('Order ahead');
  const trackingButton = tree.root.findAllByType('Pressable' as never).find((node) => String(node.props.accessibilityLabel).startsWith('On the way'));
  expect(trackingButton).toBeDefined();
  await act(async () => trackingButton?.props.onPress());
  expect(renderedText()).toContain('Tracking open');

  await act(async () => tree.unmount());
});
