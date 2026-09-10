import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator', ImageBackground: 'ImageBackground', Modal: 'Modal',
  Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View',
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ bottom: 0 }) }));
vi.mock('@expo/vector-icons/Feather', () => ({ default: 'Feather' }));
vi.mock('react-native-webview', () => ({ WebView: 'WebView' }));
vi.mock('../src/components/FoodImage', () => ({ FoodImage: () => null }));
vi.mock('../src/components/BuildYourOwnModal', () => ({ BuildYourOwnModal: () => null }));
vi.mock('../src/components/VanMap', async () => import('../src/components/VanMap.web'));

import { VanTrackingModal } from '../src/components/VanTrackingModal';
import { VanMap as NativeVanMap } from '../src/components/VanMap.native';
import { VanMap, vanRoute } from '../src/components/VanMap.web';
import { CustomerScreen } from '../src/screens/CustomerScreen';
import { initialBuildYourOwnPricing, initialInventory, products } from '../src/data';

let tree: ReturnType<typeof create>;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('__DEV__', false);
  vi.useFakeTimers();
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const visibleText = () => tree.root.findAllByType('Text' as never)
  .map((node) => React.Children.toArray(node.props.children).join('')).join('\n');
const expectNoOperationalClaims = () => {
  expect(visibleText()).not.toMatch(/\bLIVE\b|\bARRIVED\b|Acero|Collect your order now|Arriving at|\d+ minutes/i);
};

test.each([false, true])('tracking remains a demo for another workplace with stopMode=%s', async (stopMode) => {
  await act(async () => {
    tree = create(<CustomerScreen
      buildPricing={initialBuildYourOwnPricing} displayName="Customer"
      inventory={initialInventory} products={products} orders={[]}
      onOpenDriverPreview={vi.fn()} onReserve={vi.fn()} onSignOut={vi.fn()}
      profile={{ displayName: 'Customer', role: 'customer', workplaceId: 'other-id', workplaceName: 'Other workplace' }}
      profileError={null} signOutError={null} signingOut={false} stopMode={stopMode}
      user={{ id: 'customer-id' } as any}
    />);
  });
  expect(visibleText()).toContain('Other workplace');
  expect(visibleText()).toContain('TRACKING DEMO');
  expectNoOperationalClaims();
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Open tracking demo' }).props.onPress());
  expect(tree.root.findByType(VanTrackingModal).props.visible).toBe(true);
  expect(tree.root.findByType(VanMap).props.coordinate).toEqual(vanRoute[0]);
  await act(async () => { vi.advanceTimersByTime(1800); });
  expect(tree.root.findByType(VanMap).props.coordinate).toEqual(vanRoute[1]);
  await act(async () => { vi.advanceTimersByTime(10000); });
  expect(tree.root.findByType(VanMap).props.coordinate).toEqual(vanRoute[vanRoute.length - 1]);
  expect(visibleText()).toContain('Simulation complete');
  expect(visibleText()).toContain('Demo route only');
  expectNoOperationalClaims();
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Close van tracking' }).props.onPress());
  expect(tree.root.findByType(VanTrackingModal).props.visible).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => tree.root.findByProps({ accessibilityLabel: 'Open tracking demo' }).props.onPress());
  expect(tree.root.findByType(VanMap).props.coordinate).toEqual(vanRoute[0]);
  expect(visibleText()).toContain('Simulated movement');
  expectNoOperationalClaims();
});

test('native map labels its fixed route as demo data rather than an Acero arrival', async () => {
  await act(async () => { tree = create(<NativeVanMap coordinate={vanRoute[0]} />); });
  const html = tree.root.findByType('WebView' as never).props.source.html;
  expect(html).toContain("bindTooltip('Demo stop')");
  expect(html).toContain("bindTooltip('Simulated van')");
  expect(html).not.toMatch(/Acero|\bLIVE\b|Collect your order/i);
});

const injections = vi.fn();
async function openNativeMap() {
  injections.mockClear();
  await act(async () => {
    tree = create(<NativeVanMap coordinate={vanRoute[0]} />, {
      createNodeMock: (element) => element.type === 'WebView' ? { injectJavaScript: injections } : null,
    });
  });
}
const sendMapMessage = async (data: string) => {
  await act(async () => tree.root.findByType('WebView' as never).props.onMessage({ nativeEvent: { data } }));
};

test('native map replays the latest of several pre-ready coordinates and continues updating', async () => {
  await openNativeMap();
  await act(async () => tree.update(<NativeVanMap coordinate={vanRoute[1]} />));
  await act(async () => tree.update(<NativeVanMap coordinate={vanRoute[2]} />));
  expect(injections).not.toHaveBeenCalled();
  await sendMapMessage('map-ready');
  expect(injections).toHaveBeenCalledTimes(1);
  expect(injections.mock.calls[0][0]).toContain(`setVanCoordinate(${vanRoute[2].latitude}, ${vanRoute[2].longitude})`);
  await act(async () => tree.update(<NativeVanMap coordinate={vanRoute[3]} />));
  expect(injections).toHaveBeenCalledTimes(2);
  expect(injections.mock.calls[1][0]).toContain(`setVanCoordinate(${vanRoute[3].latitude}, ${vanRoute[3].longitude})`);
});

test.each(['onError', 'onHttpError', 'map-error', 'timeout'])('native map exits loading on %s and ignores late success', async (failure) => {
  await openNativeMap();
  expect(visibleText()).toContain('Loading map');
  if (failure === 'timeout') {
    await sendMapMessage('map-ready');
    await act(async () => { vi.advanceTimersByTime(15000); });
  } else if (failure === 'map-error') {
    await sendMapMessage(failure);
  } else {
    await act(async () => tree.root.findByType('WebView' as never).props[failure]());
  }
  expect(visibleText()).not.toContain('Loading map');
  expect(visibleText()).toContain('Demo map unavailable');
  expect(tree.root.findAllByType('ActivityIndicator' as never)).toHaveLength(0);
  await sendMapMessage('map-ready');
  await sendMapMessage('tiles-ready');
  expect(visibleText()).toContain('Demo map unavailable');
});

test('native map completes loading on tile readiness and cancels its initialization timeout', async () => {
  await openNativeMap();
  await sendMapMessage('map-ready');
  await sendMapMessage('tiles-ready');
  expect(visibleText()).not.toContain('Loading map');
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => { vi.advanceTimersByTime(20000); });
  expect(visibleText()).not.toContain('Demo map unavailable');
});

test('a tile-ready message batched after failure cannot clear the error', async () => {
  await openNativeMap();
  const onMessage = tree.root.findByType('WebView' as never).props.onMessage;
  await act(async () => {
    onMessage({ nativeEvent: { data: 'map-error' } });
    onMessage({ nativeEvent: { data: 'map-ready' } });
    onMessage({ nativeEvent: { data: 'tiles-ready' } });
  });
  expect(visibleText()).toContain('Demo map unavailable');
  expect(injections).not.toHaveBeenCalled();
});

test('unmounting the native map clears its loading timeout', async () => {
  await openNativeMap();
  expect(vi.getTimerCount()).toBe(1);
  await act(async () => tree.unmount());
  expect(vi.getTimerCount()).toBe(0);
});
