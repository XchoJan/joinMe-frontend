/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Firebase автоматически инициализируется из GoogleService-Info.plist
// при первом использовании @react-native-firebase/app
// Не нужно вызывать инициализацию вручную

// Настраиваем обработчик фоновых сообщений (с обработкой ошибок)
try {
  const { pushNotificationService } = require('./src/services/pushNotifications');
  pushNotificationService.setupBackgroundMessageHandler();
  
  // Настраиваем обработчик открытия уведомления при запуске приложения
  // Это нужно для обработки уведомлений, которые открыли приложение
  // Основная логика навигации будет в AppContext после входа пользователя
  pushNotificationService.setupNotificationOpenedHandler((message) => {
    console.log('Notification opened - app opened from notification (index.js):', message);
    // Основная навигация будет обработана в AppContext.setupPushNotifications
    // после того, как пользователь войдет в систему
  });
} catch (error) {
  console.warn('Firebase messaging not available:', error);
}

AppRegistry.registerComponent(appName, () => App);
