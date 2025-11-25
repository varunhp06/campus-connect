// utils/notificationUtils.ts
import * as Notifications from 'expo-notifications';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // <--- Add this
    shouldShowList: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.log('Error getting push token:', error);
    return null;
  }
};

export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.log('Error sending push notification:', error);
  }
};

export const notifyAllUsers = async (
  currentUserId: string,
  title: string,
  body: string,
  data?: any
) => {
  try {
    // Get all users except the current user
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userId', '!=', currentUserId));
    const querySnapshot = await getDocs(q);

    const notifications: Promise<void>[] = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.expoPushToken) {
        notifications.push(
          sendPushNotification(
            userData.expoPushToken,
            title,
            body,
            data
          )
        );
      }
    });

    await Promise.all(notifications);
  } catch (error) {
    console.log('Error notifying all users:', error);
  }
};

export const notifySpecificUser = async (
  userId: string,
  title: string,
  body: string,
  data?: any
) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      if (userData.expoPushToken) {
        await sendPushNotification(
          userData.expoPushToken,
          title,
          body,
          data
        );
      }
    }
  } catch (error) {
    console.log('Error notifying specific user:', error);
  }
};