import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Event, Chat, EventRequest } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { getCurrentOpenChatId } from '../services/currentChat';

interface NotificationData {
  visible: boolean;
  title: string;
  message: string;
  chatId?: string;
  eventId?: string;
}

interface AppContextType {
  currentUser: User | null;
  events: Event[];
  chats: Chat[];
  requests: EventRequest[];
  users: User[];
  loading: boolean;
  notification: NotificationData | null;
  setCurrentUser: (user: User | null) => void;
  addEvent: (event: Event) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  addChat: (chat: Chat) => void;
  addMessage: (chatId: string, message: Chat['messages'][0]) => Promise<void>;
  addRequest: (request: EventRequest) => Promise<void>;
  updateRequest: (requestId: string, status: 'approved' | 'rejected') => Promise<void>;
  addUser: (user: User) => void;
  getUserById: (userId: string) => User | undefined;
  loadUser: (userId: string) => Promise<User | undefined>;
  refreshEvents: (city?: string, silent?: boolean) => Promise<void>;
  refreshChat: (chatId: string) => Promise<void>;
  getPendingRequestsCount: (eventId: string) => number;
  getTotalPendingRequestsCount: () => number;
  loadMyEventsRequests: (eventIds: string[]) => Promise<void>;
  showNotification: (title: string, message: string, chatId?: string, eventId?: string) => void;
  hideNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCityFilter, setCurrentCityFilter] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  
  // Используем refs для хранения актуальных значений chats и events в обработчике
  const chatsRef = useRef<Chat[]>(chats);
  const eventsRef = useRef<Event[]>(events);
  
  // Обновляем refs при изменении chats и events
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);
  
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Load current user from AsyncStorage on mount
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Load events when user changes
  useEffect(() => {
    if (currentUser) {
      refreshEvents();
      setupPushNotifications();
    }
  }, [currentUser]);

  const setupPushNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const { pushNotificationService } = await import('../services/pushNotifications');
      
      // Запрашиваем разрешение
      const hasPermission = await pushNotificationService.requestPermission();
      if (!hasPermission) {
        return;
      }

      // Получаем токен
      const token = await pushNotificationService.getToken();
      if (token) {
        // Сохраняем токен на сервере
        try {
          const { api } = await import('../services/api');
          await api.updateFcmToken(currentUser.id, token);
        } catch (error) {
          // Error saving FCM token
        }
      }

      // Настраиваем обработчики уведомлений
      pushNotificationService.setupForegroundMessageHandler((message) => {
        // Можно показать локальное уведомление или обновить UI
      });

      pushNotificationService.setupNotificationOpenedHandler((message) => {
        // Обработка открытия уведомления
        const data = message.data;
        if (data?.type === 'event_request' && data?.eventId) {
          // Можно навигировать к событию
          // navigation.navigate('EventDetail', { eventId: data.eventId });
        }
      });
    } catch (error) {
      // Error setting up push notifications
    }
  };

  // Auto-refresh events every 5 seconds (silent mode - без показа loading)
  useEffect(() => {
    if (!currentUser) return;

    const intervalId = setInterval(() => {
      refreshEvents(currentCityFilter, true); // silent = true, чтобы не показывать loading
    }, 5000); // Обновляем каждые 5 секунд

    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, currentCityFilter]);

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserState(user);
        // Load user from API to get latest data
        try {
          const apiUser = await api.getUser(user.id) as User;
          setCurrentUserState(apiUser);
        } catch (error) {
          // Error loading user from API
        }
      }
    } catch (error) {
      // Error loading current user
    }
  };

  const setCurrentUser = async (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      try {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        // Save/update user on backend
        if (user.id) {
          try {
            await api.updateUser(user.id, user);
          } catch (error) {
            // If user doesn't exist, create it
            try {
              const newUser = await api.createUser(user) as User;
              setCurrentUserState(newUser);
              await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
            } catch (createError) {
              // Error creating user
            }
          }
        } else {
          const newUser = await api.createUser(user) as User;
          setCurrentUserState(newUser);
          await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
        }
        if (!users.find(u => u.id === user.id)) {
          setUsers([...users, user]);
        }
      } catch (error) {
        // Error saving user
      }
    } else {
      await AsyncStorage.removeItem('currentUser');
    }
  };

  const refreshEvents = async (city?: string, silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setCurrentCityFilter(city); // Сохраняем текущий фильтр
      const eventsData = await api.getEvents(city) as any[];
      
      // Сохраняем авторов событий в контекст
      const authorsToAdd: User[] = [];
      eventsData.forEach((event: any) => {
        if (event.author && !users.find(u => u.id === event.author.id)) {
          authorsToAdd.push(event.author);
        }
      });
      if (authorsToAdd.length > 0) {
        setUsers([...users, ...authorsToAdd]);
      }
      
      setEvents(eventsData);
      
      // Если есть текущий пользователь, загружаем requests для его событий
      if (currentUser) {
        const myEventIds = eventsData.filter((e: any) => e.authorId === currentUser.id).map((e: any) => e.id);
        if (myEventIds.length > 0) {
          await loadMyEventsRequests(myEventIds);
        }
      }
    } catch (error) {
      // Error loading events
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const addEvent = async (event: Partial<Event>): Promise<void> => {
    try {
      const createdEvent = await api.createEvent(event) as Event;
      setEvents([...events, createdEvent]);
    } catch (error: any) {
      throw error;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      // Optimistic update
      setEvents(events.map(e => e.id === eventId ? { ...e, ...updates } : e));
      // TODO: Add API endpoint for updating events if needed
    } catch (error) {
      // Error updating event
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not logged in');
    }
    try {
      await api.deleteEvent(eventId, currentUser.id);
      // Удаляем событие из списка после успешного удаления
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error: any) {
      // Парсим детальное сообщение об ошибке
      let errorMessage = 'Не удалось удалить событие';
      
      if (error?.message) {
        if (error.message.includes('not the author')) {
          errorMessage = 'Вы не являетесь автором этого события';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Событие не найдено';
        } else if (error.message.includes('Internal server error')) {
          errorMessage = 'Ошибка сервера. Попробуйте позже';
        } else {
          errorMessage = error.message;
        }
      } else if (error?.statusText) {
        errorMessage = error.statusText;
      }
      
      throw new Error(errorMessage);
    }
  };

  const addChat = (chat: Chat) => {
    setChats([...chats, chat]);
  };

  const refreshChat = async (chatId: string) => {
    try {
      const chat = await api.getChat(chatId) as Chat;
      setChats(chats.map(c => c.id === chatId ? chat : c));
    } catch (error) {
      // Error refreshing chat
    }
  };

  const addMessage = async (chatId: string, message: Chat['messages'][0]) => {
    try {
      // Optimistic update
      setChats(chats.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      ));
      
      // Send to API
      await api.sendMessage(chatId, message.userId, message.text);
      
      // Refresh chat to get server timestamp
      await refreshChat(chatId);
    } catch (error) {
      // Revert optimistic update on error
      await refreshChat(chatId);
    }
  };

  const addRequest = async (request: EventRequest) => {
    try {
      const createdRequest = await api.createEventRequest(request.eventId, request.userId) as EventRequest;
      setRequests([...requests, createdRequest]);
      // Refresh events to get updated request list
      await refreshEvents();
    } catch (error) {
      throw error;
    }
  };

  const updateRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      let updatedEvent: Event | null = null;
      
      if (status === 'approved') {
        updatedEvent = await api.approveRequest(requestId) as Event;
      } else {
        await api.rejectRequest(requestId);
      }
      
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status } : r
      ));

      // Обновляем событие в списке событий, если оно было обновлено
      if (updatedEvent) {
        setEvents(events.map(e => 
          e.id === updatedEvent!.id ? updatedEvent! : e
        ));
      }

      // Refresh events and chats (для синхронизации)
      await refreshEvents(currentCityFilter, true); // silent = true, чтобы не показывать loading
      
      // Load chat if approved
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          try {
            const chat = await api.getChatByEvent(request.eventId) as Chat;
            if (chat && chat.id) {
              setChats([...chats.filter(c => c.id !== chat.id), chat]);
            }
          } catch (error) {
            // Error loading chat
          }
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const addUser = (user: User) => {
    if (!users.find(u => u.id === user.id)) {
      setUsers([...users, user]);
    }
  };

  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  const loadUser = async (userId: string): Promise<User | undefined> => {
    // Check cache first
    let user = users.find(u => u.id === userId);
    if (user) return user;

    // Load from API
    try {
      user = await api.getUser(userId) as User;
      if (user) {
        addUser(user);
        return user;
      }
    } catch (error) {
      // Error loading user
    }
    return undefined;
  };

  const getPendingRequestsCount = (eventId: string): number => {
    return requests.filter(r => r.eventId === eventId && r.status === 'pending').length;
  };

  const getTotalPendingRequestsCount = (): number => {
    if (!currentUser) return 0;
    // Подсчитываем pending requests для всех событий, созданных текущим пользователем
    const myEventIds = events.filter(e => e.authorId === currentUser.id).map(e => e.id);
    return requests.filter(r => myEventIds.includes(r.eventId) && r.status === 'pending').length;
  };

  // Загружаем requests для всех событий пользователя
  const loadMyEventsRequests = async (eventIds: string[]) => {
    if (!currentUser || eventIds.length === 0) return;
    try {
      const allRequests: EventRequest[] = [];
      for (const eventId of eventIds) {
        try {
          const eventRequests = await api.getEventRequests(eventId) as EventRequest[];
          allRequests.push(...eventRequests);
        } catch (error) {
          // Error loading requests for event
        }
      }
      // Обновляем requests в контексте
      setRequests(prev => {
        // Удаляем старые requests для этих событий и добавляем новые
        const filtered = prev.filter(r => !eventIds.includes(r.eventId));
        return [...filtered, ...allRequests];
      });
    } catch (error) {
      // Error loading my events requests
    }
  };

  const showNotification = (title: string, message: string, chatId?: string, eventId?: string) => {
    setNotification({
      visible: true,
      title,
      message,
      chatId,
      eventId,
    });
  };

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, visible: false } : null);
  };

  // Загружаем и присоединяемся ко всем чатам пользователя для получения уведомлений
  useEffect(() => {
    if (!currentUser) return;

    const loadAndJoinAllChats = async () => {
      try {
        socketService.connect();

        // Загружаем все события, в которых пользователь участвует
        const participations = await api.getMyParticipations(currentUser.id) as Event[];

        // Для каждого события загружаем чат и присоединяемся к нему
        for (const event of participations) {
          try {
            const chat = await api.getChatByEvent(event.id) as Chat;
            if (chat && chat.id) {
              // Добавляем чат в контекст, если его еще нет
              if (!chats.find(c => c.id === chat.id)) {
                setChats(prev => [...prev, chat]);
              }
              
              // Присоединяемся к чату
              await socketService.joinChat(chat.id);
            }
          } catch (error) {
            // Error loading/joining chat for event
          }
        }

        // Также присоединяемся к чатам, которые уже есть в контексте
        for (const chat of chats) {
          try {
            await socketService.joinChat(chat.id);
          } catch (error) {
            // Error joining existing chat
          }
        }
      } catch (error) {
        // Error loading user chats
      }
    };

    loadAndJoinAllChats();
  }, [currentUser?.id]); // Загружаем при изменении пользователя

  // Глобальный обработчик для отслеживания новых сообщений и показа уведомлений
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    socketService.connect();
    
    const handleGlobalNewMessage = async (data: { chatId: string; message: any }) => {
      // Определяем userId сообщения - может быть в message.userId или message.user.id
      const messageUserId = data.message.userId || data.message.user?.id;

      // Убеждаемся, что мы присоединены к этому чату (на случай, если еще не присоединились)
      try {
        await socketService.joinChat(data.chatId);
      } catch (error) {
        // Error joining chat on message receive
      }

      // Показываем уведомление только если сообщение не от текущего пользователя
      if (messageUserId && messageUserId !== currentUser.id) {
        // Проверяем, открыт ли этот чат в данный момент
        const currentOpenChatId = getCurrentOpenChatId();

        if (data.chatId !== currentOpenChatId) {
          try {
            // Загружаем информацию о событии для получения названия
            // Используем refs для получения актуальных значений
            const currentChats = chatsRef.current;
            const currentEvents = eventsRef.current;
            const chat = currentChats.find(c => c.id === data.chatId);

            if (chat && chat.eventId) {
              const event = currentEvents.find(e => e.id === chat.eventId);

              if (event) {
                showNotification(
                  event.title,
                  data.message.text,
                  data.chatId,
                  chat.eventId
                );
              } else {
                // Если события нет в кэше, загружаем его
                try {
                  const eventData = await api.getEvent(chat.eventId) as Event;
                  showNotification(
                    eventData.title,
                    data.message.text,
                    data.chatId,
                    chat.eventId
                  );
                } catch (error) {
                  // Показываем уведомление без названия события
                  showNotification(
                    'Новое сообщение',
                    data.message.text,
                    data.chatId
                  );
                }
              }
            } else {
              // Если чата нет в кэше, загружаем его
              try {
                const chatData = await api.getChat(data.chatId) as Chat;
                if (chatData && chatData.eventId) {
                  const event = eventsRef.current.find(e => e.id === chatData.eventId);
                  if (event) {
                    showNotification(
                      event.title,
                      data.message.text,
                      data.chatId,
                      chatData.eventId
                    );
                  } else {
                    // Загружаем событие
                    try {
                      const eventData = await api.getEvent(chatData.eventId) as Event;
                      showNotification(
                        eventData.title,
                        data.message.text,
                        data.chatId,
                        chatData.eventId
                      );
                    } catch (error) {
                      showNotification(
                        'Новое сообщение',
                        data.message.text,
                        data.chatId
                      );
                    }
                  }
                } else {
                  showNotification(
                    'Новое сообщение',
                    data.message.text,
                    data.chatId
                  );
                }
              } catch (error) {
                // Показываем простое уведомление
                showNotification(
                  'Новое сообщение',
                  data.message.text,
                  data.chatId
                );
              }
            }
          } catch (error) {
            // Error showing notification
          }
        }
      }
    };

    // Регистрируем обработчик только один раз
    socketService.onNewMessage(handleGlobalNewMessage);

    return () => {
      socketService.offNewMessage(handleGlobalNewMessage);
    };
  }, [currentUser?.id]); // Используем только currentUser.id, чтобы не перерегистрировать при изменении chats/events

  return (
    <AppContext.Provider
      value={{
        currentUser,
        events,
        chats,
        requests,
        users,
        loading,
        setCurrentUser,
        addEvent,
        updateEvent,
        deleteEvent,
        addChat,
        addMessage,
        addRequest,
        updateRequest,
        addUser,
        getUserById,
        loadUser,
        refreshEvents,
        refreshChat,
        getPendingRequestsCount,
        getTotalPendingRequestsCount,
        loadMyEventsRequests,
        notification,
        showNotification,
        hideNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
