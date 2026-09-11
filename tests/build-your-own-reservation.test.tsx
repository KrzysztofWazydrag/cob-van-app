import React from 'react';
import { createRequire } from 'node:module';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('react-native', () => ({
  Image: 'Image', Modal: 'Modal', Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View',
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));

// Native image requires are opaque assets in the app; use filenames in this renderer test.
const require = createRequire(import.meta.url);
const previousPngLoader = require.extensions['.png'];
require.extensions['.png'] = (module, filename) => { module.exports = filename; };
const { BuildYourOwnModal } = await import('../src/components/BuildYourOwnModal');
if (previousPngLoader) require.extensions['.png'] = previousPngLoader;
else delete require.extensions['.png'];
import { initialBuildYourOwnPricing } from '../src/data';

let tree: ReturnType<typeof create>;
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); });
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  vi.unstubAllGlobals();
});
const reserveButton = () => tree.root.findAllByType('Pressable' as never).find((node) =>
  node.findAllByType('Text' as never).some((child) => child.props.children === 'Reserve mine'))!;
async function chooseFilling() {
  await act(async () => tree.root.findAllByProps({ accessibilityRole: 'checkbox' })[0].props.onPress());
}

test.each([true, false])('BYO closes only when reservation acceptance is true (result=%s)', async (accepted) => {
  const onReserve = vi.fn(() => accepted);
  const onClose = vi.fn();
  await act(async () => {
    tree = create(<BuildYourOwnModal available={3} onlineOrderingOpen pricing={initialBuildYourOwnPricing}
      onReserve={onReserve} onClose={onClose} visible />);
  });
  await chooseFilling();
  await act(async () => reserveButton().props.onPress());
  expect(onReserve).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledTimes(accepted ? 1 : 0);
});

test('BYO rejects selected quantity when capacity falls below it and keeps the modal open', async () => {
  const onReserve = vi.fn(() => true);
  const onClose = vi.fn();
  const render = (available: number) => <BuildYourOwnModal available={available} onlineOrderingOpen
    pricing={initialBuildYourOwnPricing} onReserve={onReserve} onClose={onClose} visible />;
  await act(async () => { tree = create(render(3)); });
  await chooseFilling();
  for (let i = 0; i < 2; i++) {
    await act(async () => tree.root.findByProps({ accessibilityLabel: 'Increase quantity' }).props.onPress());
  }
  await act(async () => tree.update(render(2)));
  expect(reserveButton().props.disabled).toBe(true);
  await act(async () => reserveButton().props.onPress());
  expect(onReserve).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});
