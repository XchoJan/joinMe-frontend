import React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { EventsScreen } from '../screens/EventsScreen';
import { CreateEventScreen } from '../screens/CreateEventScreen';
import { MyEventsScreen } from '../screens/MyEventsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AboutAppScreen } from '../screens/AboutAppScreen';
import { useApp } from '../context/AppContext';
import { InAppNotification } from '../components/InAppNotification';
import TabCalendarActive from '../assets/icons/TabCalendarActive';
import TabCalendarInactiv from '../assets/icons/TabCalendarInactiv';
import CreateEventActive from '../assets/icons/CreateEventActive';
import CreateEventInactive from '../assets/icons/CreateEventInactive';
import MyEventsActive from '../assets/icons/MyEventsActive';
import MyEventsInactive from '../assets/icons/MyEventsInactive';
import ProfileActive from '../assets/icons/ProfileActive';
import ProfileInactive from '../assets/icons/ProfileInactive';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const EventsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EventsList" component={EventsScreen} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} />
  </Stack.Navigator>
);

const MyEventsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyEventsList" component={MyEventsScreen} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { getTotalPendingRequestsCount } = useApp();
  const pendingCount = getTotalPendingRequestsCount();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingTop: 8,
          paddingBottom: 8,
          height: 102,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          bottom: 12
        },
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventsStack}
        options={{
          tabBarLabel: 'События',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ bottom: 12 }}>
              {focused ? (
                <TabCalendarActive width={24} height={24} fill={color} />
              ) : (
                <TabCalendarInactiv width={24} height={24} fill={color} />
              )}
            </View>
          ),
          tabBarLabelStyle: {bottom: 24},
          tabBarButton: (props) => {
            const isFocused = props.accessibilityState?.selected || false;
            return (
              <View
                style={{
                  flex: 1,
                  backgroundColor: isFocused 
                    ? colors.primary + '10' 
                    : 'transparent',
                  borderRadius: 8,
                  marginHorizontal: 4,
                  marginVertical: 4,
                }}
              >
                <TouchableOpacity {...props} style={{ flex: 1 }} />
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateEventScreen}
        options={{
          tabBarLabel: 'Создать',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ bottom: 12 }}>
              {focused ? (
                <CreateEventActive width={24} height={24} fill={color} />
              ) : (
                <CreateEventInactive width={24} height={24} fill={color} />
              )}
            </View>
          ),
          tabBarLabelStyle: {bottom: 24},
          tabBarButton: (props) => {
            const isFocused = props.accessibilityState?.selected || false;
            return (
              <View
                style={{
                  flex: 1,
                  backgroundColor: isFocused 
                    ? colors.primary + '10' 
                    : 'transparent',
                  borderRadius: 8,
                  marginHorizontal: 4,
                  marginVertical: 4,
                }}
              >
                <TouchableOpacity {...props} style={{ flex: 1 }} />
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="MyEvents"
        component={MyEventsStack}
        options={{
          tabBarLabel: 'Мои события',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative', bottom: 12 }}>
              {focused ? (
                <MyEventsActive width={24} height={24} fill={color} />
              ) : (
                <MyEventsInactive width={24} height={24} fill={color} />
              )}
              {pendingCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    backgroundColor: colors.error,
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      color: colors.surface,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          tabBarLabelStyle: {bottom: 24},
          tabBarButton: (props) => {
            const isFocused = props.accessibilityState?.selected || false;
            return (
              <View
                style={{
                  flex: 1,
                  backgroundColor: isFocused 
                    ? colors.primary + '10' 
                    : 'transparent',
                  borderRadius: 8,
                  marginHorizontal: 4,
                  marginVertical: 4,
                }}
              >
                <TouchableOpacity {...props} style={{ flex: 1 }} />
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ bottom: 12 }}>
              {focused ? (
                <ProfileActive width={24} height={24} fill={color} />
              ) : (
                <ProfileInactive width={24} height={24} fill={color} />
              )}
            </View>
          ),
          tabBarLabelStyle: {bottom: 24},
          tabBarButton: (props) => {
            const isFocused = props.accessibilityState?.selected || false;
            return (
              <View
                style={{
                  flex: 1,
                  backgroundColor: isFocused 
                    ? colors.primary + '10' 
                    : 'transparent',
                  borderRadius: 8,
                  marginHorizontal: 4,
                  marginVertical: 4,
                }}
              >
                <TouchableOpacity {...props} style={{ flex: 1 }} />
              </View>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
};

// Создаем ref для навигации, чтобы использовать его вне NavigationContainer
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

export const AppNavigator = () => {
  const { notification, hideNotification } = useApp();


  const handleNotificationPress = () => {
    if (!notification) return;
    
    // Сохраняем параметры навигации перед скрытием уведомления
    const chatId = notification.chatId;
    const eventId = notification.eventId;
    
    // Сначала навигируем, чтобы экран начал загружаться
    if (chatId) {
      navigationRef.current?.navigate('Chat', { chatId });
    } else if (eventId) {
      navigationRef.current?.navigate('EventDetail', { eventId });
    }
    
    // Затем скрываем уведомление с небольшой задержкой для плавности
    setTimeout(() => {
      hideNotification();
    }, 200);
  };

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="AboutApp" component={AboutAppScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      {notification && (
        <InAppNotification
          visible={notification.visible}
          title={notification.title}
          message={notification.message}
          onPress={handleNotificationPress}
          onDismiss={hideNotification}
        />
      )}
    </>
  );
};

