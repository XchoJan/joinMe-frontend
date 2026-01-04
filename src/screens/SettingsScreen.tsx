import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { colors, spacing, typography } from '../theme/colors';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser } = useApp();
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadBlockedUsers();
    }
  }, [currentUser?.id]);

  const loadBlockedUsers = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingBlocked(true);
      const { api } = await import('../services/api');
      const blocked = await api.getBlockedUsers(currentUser.id) as User[];
      setBlockedUsers(blocked);
    } catch (error) {
      // Error loading blocked users
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    if (!currentUser) return;

    Alert.alert(
      'Разблокировать пользователя',
      'Вы уверены, что хотите разблокировать этого пользователя?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Разблокировать',
          onPress: async () => {
            try {
              const { api } = await import('../services/api');
              await api.unblockUser(currentUser.id, blockedUserId);
              await loadBlockedUsers();
              Alert.alert('Успешно', 'Пользователь разблокирован');
            } catch (error: any) {
              Alert.alert('Ошибка', error?.message || 'Не удалось разблокировать пользователя');
            }
          },
        },
      ]
    );
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Заблокированные пользователи</Text>
          {loadingBlocked ? (
            <Text style={styles.loadingText}>Загрузка...</Text>
          ) : blockedUsers.length === 0 ? (
            <Text style={styles.emptyText}>Нет заблокированных пользователей</Text>
          ) : (
            blockedUsers.map((user) => (
              <View key={user.id} style={styles.blockedUserItem}>
                <View style={styles.blockedUserInfo}>
                  <Text style={styles.blockedUserName}>{user.name}</Text>
                  {user.city && (
                    <Text style={styles.blockedUserCity}>{user.city}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.unblockButton}
                  onPress={() => handleUnblock(user.id)}
                >
                  <Text style={styles.unblockButtonText}>Разблокировать</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>
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
    minWidth: 80,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  blockedUserItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  blockedUserInfo: {
    flex: 1,
  },
  blockedUserName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  blockedUserCity: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  unblockButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accent + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  unblockButtonText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '500',
  },
});

