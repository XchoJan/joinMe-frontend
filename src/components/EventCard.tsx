import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Event } from '../types';
import { colors, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';
import ProfileInactive from "../assets/icons/ProfileInactive";
import ProfileActive from "../assets/icons/ProfileActive";
import LocationIcon from "../assets/icons/LocationIcon";
import TabCalendarInactiv from "../assets/icons/TabCalendarInactiv";
import WalletIcon from "../assets/icons/WalletIcon";
import UserIcon from "../assets/icons/UserIcon";

interface EventCardProps {
  event: Event;
  onPress: () => void;
  pendingRequestsCount?: number;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress, pendingRequestsCount }) => {
  const navigation = useNavigation();
  const { getUserById, loadUser } = useApp();
  const [author, setAuthor] = React.useState<any>(null);

  useEffect(() => {
    const loadAuthor = async () => {
      // Проверяем, есть ли author в самом событии (приходит с API)
      if ((event as any).author) {
        setAuthor((event as any).author);
        return;
      }

      // Сначала проверяем в контексте
      const authorFromContext = getUserById(event.authorId);
      if (authorFromContext) {
        setAuthor(authorFromContext);
        return;
      }

      // Если нет в контексте, загружаем из API
      try {
        const loadedAuthor = await loadUser(event.authorId);
        if (loadedAuthor) {
          setAuthor(loadedAuthor);
        }
      } catch (error) {
        // Error loading author
      }
    };

    if (event.authorId) {
      loadAuthor();
    }
  }, [event.authorId, event]);

  const handleAuthorPress = (e: any) => {
    e.stopPropagation();
    // @ts-ignore
    navigation.navigate('UserProfile', { userId: event.authorId });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          {pendingRequestsCount !== undefined && pendingRequestsCount > 0 && (
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsBadgeText}>{pendingRequestsCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatLabels[event.format]}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {event.description}
      </Text>

      <View style={styles.info}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <LocationIcon width={16} height={16} fill={colors.textSecondary} />
          <Text style={styles.infoText}>
            {event.location}, {event.city}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TabCalendarInactiv width={16} height={16} fill={colors.textSecondary} />
          <Text style={styles.infoText}>
            {formatDate(event.date)} в {formatTime(event.time)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <WalletIcon width={16} height={16} fill={colors.textSecondary} />
          <Text style={styles.infoText}>
            {paymentLabels[event.paymentType]}
          </Text>
        </View>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <UserIcon width={16} height={16} fill={colors.textSecondary} />
            <Text style={styles.infoText}>
              Имя: {author?.name || 'Автор'}
            </Text>
          </View>
          {event.authorGender && (
            <Text style={styles.infoText}>
              Пол: {getGenderLabel(event.authorGender)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.participants}>
          {event.currentParticipants || (event.participants?.length || 0)}/{event.participantLimit} участников
          {event.currentParticipants && event.currentParticipants > 1 && (
            <Text style={styles.currentParticipants}>
              {' '}(их {event.currentParticipants})
            </Text>
          )}
          {event.currentParticipants && event.currentParticipants < event.participantLimit && (
            <Text style={styles.lookingFor}>
              {' '}(ищем ещё {event.participantLimit - event.currentParticipants})
            </Text>
          )}
        </Text>
        {event.requests && event.requests.length > 0 && (
          <View style={styles.requestsBadge}>
            <Text style={styles.requestsText}>
              {event.requests.length} запрос{event.requests.length > 1 ? 'ов' : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  badge: {
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
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  info: {
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  participants: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  currentParticipants: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  lookingFor: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '400',
  },
  requestsBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.xs,
  },
  requestsBadgeText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
    fontSize: 11,
  },
  requestsText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '500',
  },
});

