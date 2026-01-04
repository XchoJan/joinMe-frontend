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
} catch (error) {
  console.warn('Firebase messaging not available:', error);
}

AppRegistry.registerComponent(appName, () => App);
