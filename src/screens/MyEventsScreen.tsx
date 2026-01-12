import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Event } from '../types';
import { useApp } from '../context/AppContext';
import { EventCard } from '../components/EventCard';
import { colors, spacing, typography } from '../theme/colors';
import TrashIcon from '../assets/icons/TrashIcon';

type TabType = 'created' | 'participations';

export const MyEventsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser, refreshEvents, deleteEvent, getPendingRequestsCount, loadMyEventsRequests, requests } = useApp();
  const [activeTab, setActiveTab] = React.useState<TabType>('created');
  const [myEvents, setMyEvents] = React.useState<any[]>([]);
  const [participations, setParticipations] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (currentUser) {
      loadMyEvents();
      loadParticipations();
      
      // Auto-refresh every 5 seconds
      const intervalId = setInterval(() => {
        loadMyEvents();
        loadParticipations();
      }, 5000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (currentUser) {
      if (activeTab === 'created') {
        loadMyEvents();
      } else {
        loadParticipations();
      }
    }
  }, [activeTab, currentUser]);

  const loadMyEvents = async () => {
    if (!currentUser) return;
    try {
      const { api } = await import('../services/api');
      const events = await api.getMyEvents(currentUser.id);
      setMyEvents(events);
      
      // Загружаем requests для всех событий
      const eventIds = events.map(e => e.id);
      await loadMyEventsRequests(eventIds);
    } catch (error) {
      // Error loading my events
    }
  };

  const loadParticipations = async () => {
    if (!currentUser) return;
    try {
      const { api } = await import('../services/api');
      const events = await api.getMyParticipations(currentUser.id);
      setParticipations(events);
    } catch (error) {
      // Error loading participations
    }
  };

  const handleEventPress = (event: Event) => {
    // @ts-ignore
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleDeleteEvent = (event: Event) => {
    Alert.alert(
      'Удалить событие',
      `Вы уверены, что хотите удалить событие "${event.title}"?`,
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
              // Оптимистичное обновление - удаляем из локального списка сразу
              const eventIdToDelete = event.id;
              setMyEvents(prev => prev.filter(e => e.id !== eventIdToDelete));
              
              // Удаляем на сервере
              await deleteEvent(eventIdToDelete);
              
              // Перезагружаем список для синхронизации (на случай, если что-то изменилось)
              setTimeout(() => {
                loadMyEvents();
              }, 500);
            } catch (error: any) {
              // В случае ошибки перезагружаем список, чтобы восстановить состояние
              await loadMyEvents();
              Alert.alert('Ошибка', error?.message || 'Не удалось удалить событие');
            }
          },
        },
      ]
    );
  };

  const currentEvents = activeTab === 'created' ? myEvents : participations;
  const isEmpty = currentEvents.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Мои события</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.activeTab]}
          onPress={() => setActiveTab('created')}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
            Созданные мной
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'participations' && styles.activeTab]}
          onPress={() => setActiveTab('participations')}
        >
          <Text style={[styles.tabText, activeTab === 'participations' && styles.activeTabText]}>
            Мои участия
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const pendingCount = activeTab === 'created' ? getPendingRequestsCount(item.id) : 0;
          return (
            <View style={styles.eventContainer}>
              <EventCard 
                event={item} 
                onPress={() => handleEventPress(item)}
                pendingRequestsCount={pendingCount > 0 ? pendingCount : undefined}
              />
              {activeTab === 'created' && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteEvent(item)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TrashIcon width={16} height={16} fill={colors.error} />
                    <Text style={styles.deleteButtonText}>Удалить</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'created' 
                ? 'У вас пока нет созданных событий'
                : 'Вы пока не участвуете ни в одном событии'}
            </Text>
            {activeTab === 'created' && (
              <TouchableOpacity
                style={styles.createButton}
                // @ts-ignore
                onPress={() => navigation.navigate('Create')}
              >
                <Text style={styles.createButtonText}>Создать событие</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  createButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  createButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '500',
  },
  eventContainer: {
    marginBottom: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500',
  },
});

