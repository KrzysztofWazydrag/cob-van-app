import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  platform: { OS: 'android' },
  constants: { appOwnership: 'standalone' },
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
}));
vi.mock('react-native', () => ({ Platform: mocks.platform }));
vi.mock('expo-constants', () => ({ default: mocks.constants, AppOwnership: { Expo: 'expo' } }));
vi.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationHandler: mocks.setNotificationHandler,
  setNotificationChannelAsync: mocks.setNotificationChannelAsync,
  requestPermissionsAsync: mocks.requestPermissionsAsync,
  scheduleNotificationAsync: mocks.scheduleNotificationAsync,
}));

import { notifyVanArrived } from '../src/notifications';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.platform.OS = 'android';
  mocks.constants.appOwnership = 'standalone';
  mocks.setNotificationChannelAsync.mockResolvedValue({ id: 'arrivals' });
  mocks.requestPermissionsAsync.mockResolvedValue({ granted: true });
  mocks.scheduleNotificationAsync.mockResolvedValue('local-notification');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

test('Android awaits channel setup before permissions and schedules on arrivals', async () => {
  let finishChannel!: () => void;
  mocks.setNotificationChannelAsync.mockImplementationOnce(() => new Promise<void>((resolve) => { finishChannel = resolve; }));
  const pending = notifyVanArrived();
  await vi.waitFor(() => expect(mocks.setNotificationChannelAsync).toHaveBeenCalledOnce());
  expect(mocks.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(mocks.scheduleNotificationAsync).not.toHaveBeenCalled();
  finishChannel();
  await expect(pending).resolves.toBeUndefined();
  expect(mocks.setNotificationChannelAsync).toHaveBeenCalledWith('arrivals', { importance: 4, name: 'Van arrivals' });
  expect(mocks.requestPermissionsAsync.mock.invocationCallOrder[0]).toBeLessThan(mocks.scheduleNotificationAsync.mock.invocationCallOrder[0]);
  expect(mocks.scheduleNotificationAsync).toHaveBeenCalledWith({
    content: { body: 'Your reserved food is ready to collect.', sound: true, title: 'The Cob Van has arrived at Acero 🚐' },
    trigger: { channelId: 'arrivals' },
  });
});

test('permission denial leaves the Android channel configured and does not schedule or throw', async () => {
  mocks.requestPermissionsAsync.mockResolvedValueOnce({ granted: false });
  await expect(notifyVanArrived()).resolves.toBeUndefined();
  expect(mocks.setNotificationChannelAsync).toHaveBeenCalledOnce();
  expect(mocks.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
});

test.each(['setNotificationChannelAsync', 'requestPermissionsAsync', 'scheduleNotificationAsync'] as const)('%s rejection is contained within the local preview helper', async (method) => {
  mocks[method].mockRejectedValueOnce(new Error('Native notification failure'));
  await expect(notifyVanArrived()).resolves.toBeUndefined();
  expect(console.warn).toHaveBeenCalledWith('Unable to show the local arrival notification preview.');
  if (method !== 'scheduleNotificationAsync') expect(mocks.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('synchronous notification handler setup errors are contained', async () => {
  mocks.setNotificationHandler.mockImplementationOnce(() => { throw new Error('Module unavailable'); });
  await expect(notifyVanArrived()).resolves.toBeUndefined();
  expect(console.warn).toHaveBeenCalledOnce();
  expect(mocks.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test.each([
  ['web', 'standalone'],
  ['android', 'expo'],
  ['ios', 'expo'],
])('%s with ownership %s skips notification setup', async (platform, ownership) => {
  mocks.platform.OS = platform;
  mocks.constants.appOwnership = ownership;
  await expect(notifyVanArrived()).resolves.toBeUndefined();
  expect(mocks.setNotificationHandler).not.toHaveBeenCalled();
  expect(mocks.setNotificationChannelAsync).not.toHaveBeenCalled();
  expect(mocks.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(mocks.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('iOS keeps immediate local scheduling without an Android channel', async () => {
  mocks.platform.OS = 'ios';
  await expect(notifyVanArrived()).resolves.toBeUndefined();
  expect(mocks.setNotificationChannelAsync).not.toHaveBeenCalled();
  expect(mocks.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ trigger: null }));
});
