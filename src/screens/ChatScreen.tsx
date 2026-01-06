import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Linking,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/colors';
import { socketService } from '../services/socket';
import { Event } from '../types';
import { setCurrentOpenChatId } from '../services/currentChat';

export const ChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params as { chatId: string };
  const { currentUser, addMessage, getUserById, loadUser, refreshChat, refreshEvents, chats } = useApp();
  const [messageText, setMessageText] = useState('');
  // Инициализируем chat из кэша, если он есть
  const [chat, setChat] = useState<any>(() => chats.find(c => c.id === chatId) || null);
  const [messages, setMessages] = useState<any[]>(() => {
    const cachedChat = chats.find(c => c.id === chatId);
    return cachedChat?.messages || [];
  });
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const otherParticipant = chat?.participants.find((id: string) => id !== currentUser?.id);
  const [otherUser, setOtherUser] = useState<any>(null);
  const isAuthor = event?.authorId === currentUser?.id;

  useEffect(() => {
    loadChat();
    
    // Устанавливаем текущий открытый чат для глобального обработчика
    setCurrentOpenChatId(chatId);
    
    // Подключаемся к WebSocket и присоединяемся к чату
    const setupSocket = async () => {
      socketService.connect();
      // Ждем, пока присоединимся к комнате
      await socketService.joinChat(chatId);
    };
    setupSocket();

    // Слушаем новые сообщения
    const handleNewMessage = (data: { chatId: string; message: any }) => {
      if (data.chatId === chatId) {
        // Проверяем, нет ли уже такого сообщения
        setMessages(prev => {
          const messageExists = prev.some(m => m.id === data.message.id);
          if (messageExists) {
            return prev;
          }
          
          // Удаляем временное сообщение, если оно есть (заменяем на реальное)
          const filtered = prev.filter(m => !m.id.startsWith('temp_') || m.text !== data.message.text);
          return [...filtered, data.message];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    socketService.onNewMessage(handleNewMessage);

    // Слушаем удаление сообщений
    const handleMessageDeleted = (data: { chatId: string; messageId: string }) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    };

    // Слушаем удаление всех сообщений
    const handleAllMessagesDeleted = (data: { chatId: string }) => {
      if (data.chatId === chatId) {
        setMessages([]);
      }
    };

    socketService.onMessageDeleted(handleMessageDeleted);
    socketService.onAllMessagesDeleted(handleAllMessagesDeleted);

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offMessageDeleted(handleMessageDeleted);
      socketService.offAllMessagesDeleted(handleAllMessagesDeleted);
      // НЕ покидаем комнату при выходе из чата, чтобы продолжать получать уведомления
      // socketService.leaveChat(chatId);
      // Сбрасываем текущий открытый чат при закрытии
      setCurrentOpenChatId(null);
    };
  }, [chatId]);

  useEffect(() => {
    if (chat?.eventId) {
      loadEvent();
    }
  }, [chat?.eventId]);

  useEffect(() => {
    if (event?.participants) {
      loadParticipants();
    }
  }, [event?.participants]);

  useEffect(() => {
    if (otherParticipant && !isAuthor) {
      loadOtherUser();
    }
  }, [otherParticipant, isAuthor]);

  useEffect(() => {
    if (messages.length > 0) {
      // Используем requestAnimationFrame для более надежной прокрутки
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 150);
      });
    }
  }, [messages.length]);

  const loadChat = async () => {
    try {
      const { api } = await import('../services/api');
      const chatData = await api.getChat(chatId) as any;
      
      // Проверяем, что чат существует
      if (!chatData) {
        // Чат не найден - показываем пустой экран
        return;
      }
      
      // Обновляем chat
      setChat(chatData);
      
      if (chatData?.messages && chatData.messages.length > 0) {
        setMessages(chatData.messages);
      } else {
        try {
          const messagesData = await api.getMessages(chatId) as any[];
          setMessages(messagesData || []);
        } catch (messagesError) {
          // Если не удалось загрузить сообщения, просто оставляем пустой массив
          setMessages([]);
        }
      }
      
      // Прокручиваем к концу после загрузки сообщений
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error: any) {
      console.error('Error loading chat:', error);
      
      // При ошибке просто показываем пустой экран
      // Alert уже показан перед навигацией в EventDetailScreen
      console.error('Error loading chat:', error);
    }
  };

  const loadEvent = async () => {
    if (!chat?.eventId) return;
    try {
      const { api } = await import('../services/api');
      const eventData = await api.getEvent(chat.eventId) as Event;
      setEvent(eventData);
    } catch (error) {
      // Error loading event
    }
  };

  const loadParticipants = async () => {
    if (!event?.participants) return;
    try {
      const participantUsers = await Promise.all(
        event.participants.map(async (userId: string) => {
          const user = await loadUser(userId) || getUserById(userId);
          return user;
        })
      );
      setParticipants(participantUsers.filter(Boolean));
    } catch (error) {
      // Error loading participants
    }
  };

  const loadOtherUser = async () => {
    if (!otherParticipant) return;
    const user = await loadUser(otherParticipant) || getUserById(otherParticipant);
    setOtherUser(user);
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!event || !currentUser || !isAuthor) return;
    
    if (userId === currentUser.id) {
      Alert.alert('Ошибка', 'Нельзя удалить себя из события');
      return;
    }

    Alert.alert(
      'Удалить участника',
      'Вы уверены, что хотите удалить этого участника из события?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const { api } = await import('../services/api');
              await api.removeParticipant(event.id, userId, currentUser.id);
              
              // Обновляем событие и участников
              await loadEvent();
              await refreshEvents();
              
              Alert.alert('Успешно', 'Участник удален из события');
            } catch (error: any) {
              Alert.alert('Ошибка', error?.message || 'Не удалось удалить участника');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async (userId: string) => {
    if (!currentUser || !isAuthor) return;
    
    if (userId === currentUser.id) {
      Alert.alert('Ошибка', 'Нельзя заблокировать себя');
      return;
    }

    Alert.alert(
      'Заблокировать пользователя',
      'Заблокированный пользователь не сможет подавать заявки на ваши события. Вы уверены?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Заблокировать',
          style: 'destructive',
          onPress: async () => {
            try {
              const { api } = await import('../services/api');
              await api.blockUser(currentUser.id, userId);
              
              Alert.alert('Успешно', 'Пользователь заблокирован');
            } catch (error: any) {
              Alert.alert('Ошибка', error?.message || 'Не удалось заблокировать пользователя');
            }
          },
        },
      ]
    );
  };

  const handleInputFocus = () => {
    // Прокручиваем к концу при фокусе на инпут
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 300);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 500);
  };

  const handleSend = async () => {
    if (!messageText.trim() || !currentUser || !chat) return;

    const text = messageText.trim();
    setMessageText('');

    // Optimistic update
    const tempMessage = {
      id: `temp_${Date.now()}`,
      userId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Отправляем через WebSocket (он сам проверит подключение и присоединение к комнате)
      const sent = await socketService.sendMessage(chatId, currentUser.id, text);
      
      if (!sent) {
        // Если WebSocket не смог отправить, используем API как fallback
        await addMessage(chatId, tempMessage);
      }
    } catch (error) {
      // Удаляем временное сообщение при ошибке
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      // Перезагружаем чат при ошибке
      await loadChat();
    }
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser || !isAuthor) return;

    Alert.alert(
      'Удалить сообщение',
      'Вы уверены, что хотите удалить это сообщение?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update - удаляем из локального списка сразу
              setMessages(prev => prev.filter(m => m.id !== messageId));
              
              // Удаляем на сервере
              const { api } = await import('../services/api');
              await api.deleteMessage(chatId, messageId, currentUser.id);
            } catch (error) {
              // В случае ошибки перезагружаем чат
              await loadChat();
              Alert.alert('Ошибка', 'Не удалось удалить сообщение');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllMessages = async () => {
    if (!currentUser || !isAuthor) return;

    Alert.alert(
      'Удалить все сообщения',
      'Вы уверены, что хотите удалить всю переписку? Это действие нельзя отменить.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить все',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update - очищаем локальный список сразу
              setMessages([]);
              
              // Удаляем на сервере
              const { api } = await import('../services/api');
              await api.deleteAllMessages(chatId, currentUser.id);
            } catch (error) {
              // В случае ошибки перезагружаем чат
              await loadChat();
              Alert.alert('Ошибка', 'Не удалось удалить сообщения');
            }
          },
        },
      ]
    );
  };

  const handleShareContact = async (type: 'instagram' | 'telegram') => {
    if (!currentUser || !chat) return;
    
    const contact = type === 'instagram' ? currentUser.instagram : currentUser.telegram;
    if (!contact) return;

    // Убираем @ если есть, и создаем ссылку
    const username = contact.replace('@', '').trim();
    const link = type === 'instagram' 
      ? `https://instagram.com/${username}`
      : `https://t.me/${username}`;

    // Отправляем сообщение со ссылкой
    const messageText = `${type === 'instagram' ? '📷 Instagram' : '✈️ Telegram'}: ${contact}\n${link}`;

    // Optimistic update
    const tempMessage = {
      id: `temp_${Date.now()}`,
      userId: currentUser.id,
      text: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Отправляем через WebSocket (он сам проверит подключение и присоединение к комнате)
      const sent = await socketService.sendMessage(chatId, currentUser.id, messageText);
      
      if (!sent) {
        // Если WebSocket не смог отправить, используем API как fallback
        await addMessage(chatId, tempMessage);
      }
    } catch (error) {
      // Удаляем временное сообщение при ошибке
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      await loadChat();
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      // Пробуем открыть через нативное приложение
      let appUrl = url;
      
      // Для Instagram пробуем открыть через приложение
      if (url.includes('instagram.com')) {
        const username = url.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          // Пробуем открыть через приложение Instagram
          const instagramAppUrl = `instagram://user?username=${username}`;
          const canOpenApp = await Linking.canOpenURL(instagramAppUrl);
          if (canOpenApp) {
            appUrl = instagramAppUrl;
          }
        }
      }
      
      // Для Telegram пробуем открыть через приложение
      if (url.includes('t.me')) {
        const username = url.split('t.me/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          // Пробуем открыть через приложение Telegram
          const telegramAppUrl = `tg://resolve?domain=${username}`;
          const canOpenApp = await Linking.canOpenURL(telegramAppUrl);
          if (canOpenApp) {
            appUrl = telegramAppUrl;
          }
        }
      }
      
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        // Если не можем открыть приложение, открываем в браузере
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось открыть ссылку');
    }
  };

  const parseMessageLinks = (text: string) => {
    // Ищем ссылки на Instagram и Telegram
    const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/([^\s]+)/gi;
    const telegramRegex = /https?:\/\/(www\.)?t\.me\/([^\s]+)/gi;
    
    const parts: Array<{ text: string; link?: string; type?: 'instagram' | 'telegram' }> = [];
    let lastIndex = 0;
    
    // Находим все совпадения
    const matches: Array<{ index: number; length: number; url: string; type: 'instagram' | 'telegram' }> = [];
    
    let match;
    while ((match = instagramRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        url: match[0],
        type: 'instagram',
      });
    }
    
    while ((match = telegramRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        url: match[0],
        type: 'telegram',
      });
    }
    
    // Сортируем по индексу
    matches.sort((a, b) => a.index - b.index);
    
    // Разбиваем текст на части
    matches.forEach((match) => {
      // Добавляем текст до ссылки
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index) });
      }
      
      // Добавляем ссылку
      parts.push({
        text: text.substring(match.index, match.index + match.length),
        link: match.url,
        type: match.type,
      });
      
      lastIndex = match.index + match.length;
    });
    
    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex) });
    }
    
    return parts.length > 0 ? parts : [{ text }];
  };

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Загрузка чата...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Проверяем, есть ли участники в чате
  const hasParticipants = chat.participants && chat.participants.length > 0;
  if (!hasParticipants) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>В чате пока нет участников</Text>
          <Text style={[styles.emptyText, { marginTop: 8, fontSize: 14, opacity: 0.7 }]}>
            Пожалуйста, подождите, пока кто-то откликнется на событие
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const headerTitle = isAuthor && event 
    ? event.title 
    : (otherUser?.name || 'Участник');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => {
            if (isAuthor && event) {
              // @ts-ignore
              navigation.navigate('EventDetail', { eventId: event.id });
            } else if (otherParticipant) {
              // @ts-ignore
              navigation.navigate('UserProfile', { userId: otherParticipant });
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>
        </TouchableOpacity>
        {isAuthor ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.deleteAllButton}
              onPress={handleDeleteAllMessages}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteAllButtonText}>🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.participantsButton}
              onPress={() => setShowParticipants(!showParticipants)}
              activeOpacity={0.7}
            >
              <Text style={styles.participantsButtonText}>
                👥 {participants.length}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      {isAuthor && showParticipants && (
        <View style={styles.participantsContainer}>
          <Text style={styles.participantsTitle}>Участники ({participants.length})</Text>
          <ScrollView style={styles.participantsList}>
            {participants.map((participant) => (
              <View key={participant.id} style={styles.participantItem}>
                <TouchableOpacity
                  style={styles.participantInfo}
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('UserProfile', { userId: participant.id });
                  }}
                >
                  <Text style={styles.participantName}>{participant.name}</Text>
                  {participant.bio && (
                    <Text style={styles.participantBio} numberOfLines={1}>
                      {participant.bio}
                    </Text>
                  )}
                </TouchableOpacity>
                {participant.id !== currentUser?.id && isAuthor && (
                  <View style={styles.participantActions}>
                    <TouchableOpacity
                      style={styles.blockButton}
                      onPress={() => handleBlockUser(participant.id)}
                    >
                      <Text style={styles.blockButtonText}>🚫</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveParticipant(participant.id)}
                    >
                      <Text style={styles.removeButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => {
            // Прокручиваем к концу при изменении размера контента
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 50);
          }}
          onLayout={() => {
            // Прокручиваем к концу при отрисовке компонента
            if (messages.length > 0) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 100);
            }
          }}
          onScrollBeginDrag={() => setShowContactMenu(false)}
          onTouchStart={() => setShowContactMenu(false)}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          renderItem={({ item }) => {
            const isMyMessage = item.userId === currentUser?.id;
            const messageUser = getUserById(item.userId);
            const messageParts = parseMessageLinks(item.text);

            return (
              <TouchableOpacity
                style={[
                  styles.messageContainer,
                  isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
                ]}
                onLongPress={() => {
                  // Только автор события может удалять сообщения
                  if (isAuthor) {
                    handleDeleteMessage(item.id);
                  }
                }}
                activeOpacity={0.9}
                disabled={!isAuthor}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessage : styles.otherMessage,
                  ]}
                >
                  <View style={styles.messageTextContainer}>
                    {messageParts.map((part, index) => {
                      if (part.link) {
                        return (
                          <TouchableOpacity
                            key={index}
                            onPress={() => handleOpenLink(part.link!)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.messageText,
                                isMyMessage ? styles.myMessageText : styles.otherMessageText,
                                styles.linkText,
                              ]}
                            >
                              {part.text}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <Text
                          key={index}
                          style={[
                            styles.messageText,
                            isMyMessage ? styles.myMessageText : styles.otherMessageText,
                          ]}
                        >
                          {part.text}
                        </Text>
                      );
                    })}
                  </View>
                  <Text
                    style={[
                      styles.messageTime,
                      isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
                    ]}
                  >
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Начните общение
              </Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          {(currentUser?.instagram || currentUser?.telegram) && (
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setShowContactMenu(!showContactMenu)}
              activeOpacity={0.7}
            >
              <Text style={styles.attachButtonText}>📎</Text>
            </TouchableOpacity>
          )}
          {showContactMenu && (currentUser?.instagram || currentUser?.telegram) && (
            <View style={styles.contactMenu}>
              {currentUser?.instagram && (
                <TouchableOpacity
                  style={styles.contactMenuItem}
                  onPress={() => {
                    handleShareContact('instagram');
                    setShowContactMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactMenuIcon}>📷</Text>
                  <Text style={styles.contactMenuText}>Instagram</Text>
                </TouchableOpacity>
              )}
              {currentUser?.telegram && (
                <TouchableOpacity
                  style={styles.contactMenuItem}
                  onPress={() => {
                    handleShareContact('telegram');
                    setShowContactMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactMenuIcon}>✈️</Text>
                  <Text style={styles.contactMenuText}>Telegram</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Написать сообщение..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            onFocus={handleInputFocus}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim()}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 80,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    padding: spacing.md,
  },
  messageContainer: {
    marginBottom: spacing.sm,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  messageText: {
    ...typography.body,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  myMessageText: {
    color: colors.surface,
  },
  otherMessageText: {
    color: colors.text,
  },
  messageTime: {
    ...typography.caption,
    fontSize: 10,
  },
  myMessageTime: {
    color: colors.surface,
    opacity: 0.7,
  },
  otherMessageTime: {
    color: colors.textSecondary,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  attachButtonText: {
    fontSize: 20,
  },
  contactMenu: {
    position: 'absolute',
    bottom: 60,
    left: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minWidth: 150,
    zIndex: 1000,
  },
  contactMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  contactMenuIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  contactMenuText: {
    ...typography.body,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    ...typography.body,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    color: colors.text,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...typography.h3,
    color: colors.surface,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  deleteAllButtonText: {
    fontSize: 20,
  },
  participantsButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  participantsButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  participantsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    maxHeight: 200,
  },
  participantsTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  participantsList: {
    maxHeight: 150,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  participantBio: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  blockButton: {
    padding: spacing.sm,
  },
  blockButtonText: {
    fontSize: 18,
  },
  removeButton: {
    padding: spacing.sm,
  },
  removeButtonText: {
    fontSize: 18,
  },
});

