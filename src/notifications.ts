import Constants, { AppOwnership } from 'expo-constants';
import { Platform } from 'react-native';

export async function notifyVanArrived() {
  if (Platform.OS === 'web' || Constants.appOwnership === AppOwnership.Expo) return;

  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('arrivals', {
        importance: Notifications.AndroidImportance.HIGH,
        name: 'Van arrivals',
      });
    }

    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        body: 'Your reserved food is ready to collect.',
        sound: true,
        title: 'The Cob Van has arrived at Acero 🚐',
      },
      trigger: Platform.OS === 'android' ? { channelId: 'arrivals' } : null,
    });
  } catch {
    console.warn('Unable to show the local arrival notification preview.');
  }
}
