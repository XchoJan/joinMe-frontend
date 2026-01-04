import { Platform } from 'react-native';

// Динамический импорт для избежания ошибок при отсутствии Firebase
let messaging: any = null;
let firebaseApp: any = null;

try {
  firebaseApp = require('@react-native-firebase/app').default;
  messaging = require('@react-native-firebase/messaging').default;
  
  // Инициализируем Firebase явно, если еще не инициализирован
  // Данные берутся из GoogleService-Info.plist автоматически
      try {
        // Используем новый модульный API: getApp() вместо app()
        if (firebaseApp && typeof firebaseApp.getApp !== 'undefined') {
          try {
            firebaseApp.getApp();
          } catch (e: any) {
            // Если приложения нет, создаем его (но обычно это делается автоматически)
          }
        } else if (firebaseApp && typeof firebaseApp.apps !== 'undefined') {
          // Fallback для старого API
          if (firebaseApp.apps.length === 0) {
            firebaseApp.app();
          }
        }
      } catch (initError: any) {
        // Firebase initialization check
      }
    } catch (error) {
      // Firebase modules not available
    }

class PushNotificationService {
  private fcmToken: string | null = null;

  private isAvailable(): boolean {
    return messaging !== null;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Убедимся, что Firebase App инициализирован перед использованием
      if (firebaseApp) {
        try {
          // Используем новый модульный API: getApp() вместо app()
          const app = firebaseApp.getApp ? firebaseApp.getApp() : firebaseApp.app();
          if (!app) {
            return false;
          }
        } catch (appError: any) {
          // Если ошибка "No Firebase App", значит файл не найден или не инициализирован
          if (appError?.message?.includes('No Firebase App')) {
            return false;
          }
          // Другие ошибки игнорируем (например, "already exists")
        }
      }

      // Firebase автоматически инициализируется из GoogleService-Info.plist
      // при первом использовании messaging()
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        return enabled;
      } else {
        // Android permissions are automatically granted
        return true;
      }
    } catch (error: any) {
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Firebase автоматически инициализируется из GoogleService-Info.plist
      const token = await messaging().getToken();
      this.fcmToken = token;
      return token;
    } catch (error: any) {
      return null;
    }
  }

  async deleteToken(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await messaging().deleteToken();
      this.fcmToken = null;
    } catch (error) {
      // Error deleting FCM token
    }
  }

  setupBackgroundMessageHandler() {
    if (!this.isAvailable()) {
      return;
    }

    try {
      // Обработчик для фоновых сообщений (когда приложение закрыто)
      messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
        // Message handled in the background
      });
    } catch (error) {
      // Error setting up background message handler
    }
  }

  setupForegroundMessageHandler(onMessage: (message: any) => void) {
    if (!this.isAvailable()) {
      return () => {};
    }

    try {
      // Обработчик для сообщений, когда приложение открыто
      const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
        onMessage(remoteMessage);
      });

      return unsubscribe;
    } catch (error) {
      return () => {};
    }
  }

  setupNotificationOpenedHandler(onNotificationOpened: (message: any) => void) {
    if (!this.isAvailable()) {
      return () => {};
    }

    try {
      // Обработчик для уведомлений, которые открыли приложение
      messaging()
        .getInitialNotification()
        .then((remoteMessage: any) => {
          if (remoteMessage) {
            onNotificationOpened(remoteMessage);
          }
        })
        .catch((error: any) => {
          // Error getting initial notification
        });

      // Обработчик для уведомлений, когда приложение в фоне
      // Используем новый модульный API (v22+)
      // onNotificationOpenedApp теперь вызывается через messaging().onNotificationOpenedApp()
      const messagingInstance = messaging();
      const unsubscribe = messagingInstance.onNotificationOpenedApp((remoteMessage: any) => {
        onNotificationOpened(remoteMessage);
      });

      return unsubscribe;
    } catch (error) {
      return () => {};
    }
  }

  getCurrentToken(): string | null {
    return this.fcmToken;
  }
}

export const pushNotificationService = new PushNotificationService();

