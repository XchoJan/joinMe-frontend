import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Event, EventRequest } from '../types';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/colors';
import LocationIcon from '../assets/icons/LocationIcon';
import BackIcon from '../assets/icons/BackIcon';
import TabCalendarInactiv from '../assets/icons/TabCalendarInactiv';
import WalletIcon from '../assets/icons/WalletIcon';
import UserIcon from '../assets/icons/UserIcon';
import ParticipantsIcon from '../assets/icons/ParticipantsIcon';

export const EventDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId } = route.params as { eventId: string };
  const { currentUser, updateRequest, addRequest, chats, addMessage, getUserById, loadUser, refreshEvents } = useApp();
  const [event, setEvent] = React.useState<any>(null);
  const [requests, setRequests] = React.useState<any[]>([]);
  const [requestUsers, setRequestUsers] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    loadEvent();
    loadRequests();
    
    // Auto-refresh event and requests every 5 seconds
    const intervalId = setInterval(() => {
      loadEvent();
      loadRequests();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [eventId]);

  React.useEffect(() => {
    // Load users for requests
    const loadRequestUsers = async () => {
      const users: Record<string, any> = {};
      for (const request of requests) {
        if (!requestUsers[request.userId]) {
          try {
            const user = await loadUser(request.userId) || getUserById(request.userId);
            if (user) {
              users[request.userId] = user;
            }
          } catch (error) {
            // Error loading user
          }
        } else {
          users[request.userId] = requestUsers[request.userId];
        }
      }
      if (Object.keys(users).length > 0) {
        setRequestUsers({ ...requestUsers, ...users });
      }
    };
    if (requests.length > 0) {
      loadRequestUsers();
    }
  }, [requests.length]);

  const loadEvent = async () => {
    try {
      const { api } = await import('../services/api');
      const eventData = await api.getEvent(eventId);
      setEvent(eventData);
      
      // Если автор пришел с событием, сохраняем его в контекст
      if ((eventData as any)?.author) {
        const author = (eventData as any).author;
        const authorFromContext = getUserById(author.id);
        if (!authorFromContext) {
          // Автор будет сохранен через loadUser
          try {
            await loadUser(author.id);
          } catch (error) {
            // Error loading author
          }
        }
      } else if (eventData?.authorId) {
        // Если автора нет в событии, загружаем отдельно
        const authorFromContext = getUserById(eventData.authorId);
        if (!authorFromContext) {
          try {
            await loadUser(eventData.authorId);
          } catch (error) {
            // Error loading author
          }
        }
      }
    } catch (error) {
      // Error loading event
    }
  };

  const loadRequests = async () => {
    try {
      const { api } = await import('../services/api');
      const requestsData = await api.getEventRequests(eventId);
      setRequests(requestsData);
    } catch (error) {
      // Error loading requests
    }
  };
  const isAuthor = event?.authorId === currentUser?.id;
  const isParticipant = event?.participants?.includes(currentUser?.id || '') || false;
  const hasRequested = requests.some(r => r.eventId === eventId && r.userId === currentUser?.id && r.status === 'pending');
  const pendingRequests = requests.filter(r => r.eventId === eventId && r.status === 'pending');
  
  // Проверка заполненности профиля
  const isProfileComplete = currentUser?.name && currentUser?.city;
  const eventChat = chats.find(c => c.eventId === eventId);

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Событие не найдено</Text>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatLabels: Record<string, string> = {
    coffee: 'Кофе',
    walk: 'Прогулка',
    lunch: 'Обед',
    dinner: 'Ужин',
    activity: 'Активность',
    other: 'Другое',
  };

  const paymentLabels: Record<string, string> = {
    dutch: 'Пополам',
    my_treat: 'Я угощаю',
    your_treat: 'Ты угощаешь',
    free: 'Бесплатно',
  };

  const getGenderLabel = (gender?: string) => {
    if (gender === 'male') return 'Мужской';
    if (gender === 'female') return 'Женский';
    return 'Не указан';
  };

  const author = getUserById(event?.authorId);

  const handleRequestJoin = async () => {
    if (!currentUser || !event) return;

    // Проверяем, не заблокирован ли пользователь автором события
    try {
      const { api } = await import('../services/api');
      const isBlocked = await api.isBlocked(event.authorId, currentUser.id);
      
      if (isBlocked) {
        Alert.alert(
          'Невозможно подать заявку',
          'Вы заблокированы автором этого события и не можете подавать заявки на его события.',
        );
        return;
      }
    } catch (error) {
      // Если проверка не удалась, продолжаем попытку подать заявку
    }

    try {
      await addRequest({
        id: `request_${Date.now()}`,
        eventId: event.id,
        userId: currentUser.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      await loadRequests();
    } catch (error: any) {
      // Проверяем, не связана ли ошибка с блокировкой
      if (error?.message?.includes('blocked')) {
        Alert.alert(
          'Невозможно подать заявку',
          'Вы заблокированы автором этого события и не можете подавать заявки на его события.',
        );
      } else {
        Alert.alert('Ошибка', error?.message || 'Не удалось подать заявку');
      }
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await updateRequest(requestId, 'approved');
      await loadEvent();
      await loadRequests();
    } catch (error) {
      // Error approving request
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateRequest(requestId, 'rejected');
      await loadRequests();
    } catch (error) {
      // Error rejecting request
    }
  };

  const handleOpenChat = async () => {
    try {
      const { api } = await import('../services/api');
      let chatToOpen = eventChat;
      
      // Если чата нет в кэше, загружаем с API
      if (!chatToOpen) {
        try {
          chatToOpen = await api.getChatByEvent(eventId) as any;
        } catch (error) {
          // Чат не найден
        }
      }
      
      // Проверяем, что чат существует
      if (!chatToOpen) {
        Alert.alert(
          'Чат не готов',
          'Чат еще не создан. Пожалуйста, подождите, пока кто-то откликнется на событие.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Проверяем наличие участников
      if (!chatToOpen.participants || chatToOpen.participants.length === 0) {
        Alert.alert(
          'Чат пуст',
          'В чате пока нет участников. Пожалуйста, подождите, пока кто-то откликнется на событие.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Если все ок, открываем чат
      // @ts-ignore
      navigation.navigate('Chat', { chatId: chatToOpen.id });
    } catch (error: any) {
      console.error('Error opening chat:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось открыть чат. Пожалуйста, попробуйте позже.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLeaveEvent = async () => {
    if (!currentUser || !event) return;

    Alert.alert(
      'Покинуть событие',
      'Вы уверены, что хотите покинуть это событие?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Покинуть',
          style: 'destructive',
          onPress: async () => {
            try {
              const { api } = await import('../services/api');
              await api.leaveEvent(event.id, currentUser.id);
              
              // Обновляем событие и список событий
              await loadEvent();
              await refreshEvents();
              
              Alert.alert('Успешно', 'Вы покинули событие', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Ошибка', error?.message || 'Не удалось покинуть событие');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackIcon width={24} height={24} fill={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatLabels[event.format]}</Text>
          </View>
        </View>

        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.infoSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LocationIcon width={16} height={16} fill={colors.textSecondary} />
            <Text style={styles.infoLabel}>Место</Text>
          </View>
          <Text style={styles.infoValue}>{event.location}, {event.city}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TabCalendarInactiv width={16} height={16} fill={colors.textSecondary} />
            <Text style={styles.infoLabel}>Дата и время</Text>
          </View>
          <Text style={styles.infoValue}>
            {formatDate(event.date)} в {event.time}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <WalletIcon width={16} height={16} fill={colors.textSecondary} />
            <Text style={styles.infoLabel}>Кто платит</Text>
          </View>
          <Text style={styles.infoValue}>{paymentLabels[event.paymentType]}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ParticipantsIcon width={16} height={16} fill={colors.textSecondary} />
            <Text style={styles.infoLabel}>Участники</Text>
          </View>
          <Text style={styles.infoValue}>
            {event.currentParticipants || (event.participants?.length || 0)} / {event.participantLimit}
            {event.currentParticipants && event.currentParticipants > 1 && (
              <Text style={styles.currentParticipantsText}>
                {'\n'}Их {event.currentParticipants}
              </Text>
            )}
            {event.currentParticipants && event.currentParticipants < event.participantLimit && (
              <Text style={styles.lookingForText}>
                {'\n'}Ищем ещё {event.participantLimit - event.currentParticipants} человек
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <UserIcon width={16} height={16} fill={colors.textSecondary} />
            <Text style={styles.infoLabel}>Имя</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // @ts-ignore
              navigation.navigate('UserProfile', { userId: event.authorId });
            }}
          >
            <Text style={styles.infoValue}>
              {author?.name || 'Автор'}
            </Text>
          </TouchableOpacity>
        </View>

        {event.authorGender && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Пол</Text>
            <Text style={styles.infoValue}>
              {getGenderLabel(event.authorGender)}
            </Text>
          </View>
        )}

        {isAuthor && pendingRequests.length > 0 && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Запросы на участие</Text>
            {pendingRequests.map((request) => {
              const requester = requestUsers[request.userId] || getUserById(request.userId);
              return (
                <TouchableOpacity
                  key={request.id}
                  style={styles.requestCard}
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('UserProfile', { userId: request.userId });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{requester?.name || 'Пользователь'}</Text>
                    {requester?.bio && (
                      <Text style={styles.requestBio}>{requester.bio}</Text>
                    )}
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleApprove(request.id);
                      }}
                    >
                      <Text style={styles.approveButtonText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleReject(request.id);
                      }}
                    >
                      <Text style={styles.rejectButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {isParticipant && (
          <View style={styles.chatSection}>
            <Button
              title="Открыть чат"
              onPress={handleOpenChat}
              variant="secondary"
            />
            {!isAuthor && (
              <View style={styles.leaveButtonContainer}>
                <Button
                  title="Покинуть событие"
                  onPress={handleLeaveEvent}
                  variant="outline"
                  style={styles.leaveButton}
                  textStyle={styles.leaveButtonText}
                />
              </View>
            )}
          </View>
        )}

        {!isAuthor && !isParticipant && !hasRequested && (event.participants?.length || 0) < event.participantLimit && (
          <View style={styles.actionSection}>
            {isProfileComplete ? (
              <Button
                title="Подать заявку"
                onPress={handleRequestJoin}
              />
            ) : (
              <View style={styles.profileWarningContainer}>
                <Text style={styles.profileWarningText}>
                  Для подачи заявки необходимо заполнить профиль
                </Text>
                <Button
                  title="Перейти в профиль"
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('Profile');
                  }}
                  variant="outline"
                  style={styles.profileButton}
                />
              </View>
            )}
          </View>
        )}

        {hasRequested && (
          <View style={styles.actionSection}>
            <Text style={styles.pendingText}>Заявка отправлена, ожидайте ответа</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  badgeText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '500',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  infoSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  currentParticipantsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  lookingForText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontStyle: 'italic',
  },
  requestsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  requestBio: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: colors.success + '20',
  },
  approveButtonText: {
    ...typography.h3,
    color: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error + '20',
  },
  rejectButtonText: {
    ...typography.h3,
    color: colors.error,
  },
  chatSection: {
    marginTop: spacing.lg,
  },
  leaveButtonContainer: {
    marginTop: spacing.md,
  },
  leaveButton: {
    borderColor: colors.error,
  },
  leaveButtonText: {
    color: colors.error,
  },
  actionSection: {
    marginTop: spacing.lg,
  },
  pendingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  profileWarningContainer: {
    alignItems: 'center',
    padding: spacing.md,
  },
  profileWarningText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  profileButton: {
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

