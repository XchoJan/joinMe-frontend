import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type {
  ImagePickerResponse,
  ImagePickerOptions,
} from 'react-native-image-picker';
import { useApp } from '../context/AppContext';
import { Input } from '../components/Input';
import { Picker } from '../components/Picker';
import { Button } from '../components/Button';
import { Gender, User } from '../types';
import { colors, spacing, typography } from '../theme/colors';

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: 'Мужской', value: 'male' },
  { label: 'Женский', value: 'female' },
];

const CITIES = [
  { label: 'Ереван', value: 'Ереван' },
  { label: 'Гюмри', value: 'Гюмри' },
  { label: 'Ванадзор', value: 'Ванадзор' },
  { label: 'Абовян', value: 'Абовян' },
  { label: 'Капан', value: 'Капан' },
  { label: 'Армавир', value: 'Армавир' },
  { label: 'Гавар', value: 'Гавар' },
  { label: 'Иджеван', value: 'Иджеван' },
  { label: 'Аштарак', value: 'Аштарак' },
  { label: 'Севан', value: 'Севан' },
  { label: 'Дилижан', value: 'Дилижан' },
  { label: 'Степанаван', value: 'Степанаван' },
  { label: 'Артик', value: 'Артик' },
  { label: 'Алаверди', value: 'Алаверди' },
  { label: 'Масис', value: 'Масис' },
  { label: 'Веди', value: 'Веди' },
  { label: 'Ехегнадзор', value: 'Ехегнадзор' },
  { label: 'Горис', value: 'Горис' },
  { label: 'Мегри', value: 'Мегри' },
  { label: 'Спитак', value: 'Спитак' },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser, setCurrentUser, loadUser, refreshCurrentUser, deleteAccount } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    city: currentUser?.city || '',
    gender: currentUser?.gender || '' as Gender | '',
    instagram: currentUser?.instagram || '',
    telegram: currentUser?.telegram || '',
    username: currentUser?.username || '',
    password: '', // Пароль не сохраняем в состояние, только для отправки
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Обновляем пользователя с API при открытии профиля
  React.useEffect(() => {
    if (currentUser?.id) {
      console.log('ProfileScreen: Refreshing user from API');
      refreshCurrentUser().catch(err => {
        console.error('ProfileScreen: Error refreshing user:', err);
      });
    }
  }, []); // Выполняется только при монтировании

  const handlePickImage = () => {
    const imagePicker = require('react-native-image-picker');
    
    if (!imagePicker || !imagePicker.launchImageLibrary) {
      Alert.alert(
        'Ошибка',
        'Библиотека выбора изображений не доступна. Пожалуйста, выполните:\n1. cd ios && pod install\n2. Пересоберите приложение'
      );
      return;
    }

    const options: ImagePickerOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 1,
    };

    imagePicker.launchImageLibrary(options, async (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        let errorMessage = 'Не удалось выбрать изображение';
        if (response.errorMessage) {
          errorMessage = response.errorMessage;
        } else if (response.errorCode === 'permission') {
          errorMessage = 'Нет доступа к галерее. Разрешите доступ в настройках приложения.';
        }
        Alert.alert('Ошибка', errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (!imageUri || !currentUser) return;

        try {
          setUploadingAvatar(true);
          const { api } = await import('../services/api');
          // Для React Native image picker путь уже правильный
          const result = await api.uploadAvatar(imageUri, currentUser.photo);

          // Обновляем пользователя с новым URL фото
          const updatedUser = {
            ...currentUser,
            photo: `${api.baseUrl}${result.url}`,
          };
          await setCurrentUser(updatedUser);
          
          Alert.alert('Успешно', 'Фото профиля обновлено');
        } catch (error: any) {
          Alert.alert('Ошибка', error?.message || 'Не удалось загрузить фото');
        } finally {
          setUploadingAvatar(false);
        }
      }
    });
  };

  const handleAboutApp = () => {
    // @ts-ignore
    navigation.navigate('AboutApp');
  };

  const handleContactUs = async () => {
    const telegramUsername = 'JoinMe_Support';
    // Пробуем открыть через приложение Telegram
    const telegramAppUrl = `tg://resolve?domain=${telegramUsername}`;
    const webUrl = `https://t.me/${telegramUsername}`;
    
    try {
      const canOpenApp = await Linking.canOpenURL(telegramAppUrl);
      if (canOpenApp) {
        await Linking.openURL(telegramAppUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось открыть Telegram');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.city) {
      Alert.alert('Ошибка', 'Заполните имя и город');
      return;
    }

    const user: any = {
      id: currentUser?.id || `user_${Date.now()}`,
      name: formData.name.trim(),
      bio: formData.bio.trim(),
      city: formData.city,
      gender: formData.gender || undefined,
      instagram: formData.instagram.trim() || undefined,
      telegram: formData.telegram.trim() || undefined,
      photo: currentUser?.photo, // Сохраняем фото
      premium: currentUser?.premium || false, // Сохраняем premium статус
    };
    
    // Добавляем username и password только если они заполнены
    if (formData.username.trim()) {
      user.username = formData.username.trim();
    }
    if (formData.password.trim()) {
      user.password = formData.password.trim();
    }

    try {
      await setCurrentUser(user);
      setIsEditing(false);
      Alert.alert('Успешно', 'Профиль сохранен');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Ошибка', 
        error?.message || 'Не удалось сохранить профиль. Проверьте подключение к интернету.'
      );
    }
  };

  const handleLogin = async () => {
    if (!loginData.username.trim() || !loginData.password.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      const { api } = await import('../services/api');
      const user = await api.login(loginData.username.trim(), loginData.password) as User;
      await setCurrentUser(user);
      setShowLoginModal(false);
      setLoginData({ username: '', password: '' });
      Alert.alert('Успешно', 'Вы вошли в свой профиль');
    } catch (error: any) {
      Alert.alert('Ошибка', error?.message || 'Неверный никнейм или пароль');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удаление аккаунта',
      'Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить. Все ваши данные, события, чаты и сообщения будут безвозвратно удалены.',
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
              await deleteAccount();
              Alert.alert('Аккаунт удален', 'Ваш аккаунт был успешно удален.');
            } catch (error: any) {
              Alert.alert('Ошибка', error?.message || 'Не удалось удалить аккаунт');
            }
          },
        },
      ]
    );
  };

  if (!currentUser && !isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Создайте профиль</Text>
          <Button
            title="Создать профиль"
            onPress={() => setIsEditing(true)}
          />
          <View style={{ marginTop: 20 }}>
            <Button
              title="Войти по никнейму и паролю"
              onPress={() => setShowLoginModal(true)}
              variant="outline"
            />
          </View>
        </View>

        <Modal
          visible={showLoginModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLoginModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Вход в профиль</Text>
              <Text style={styles.modalSubtitle}>
                Введите никнейм и пароль для входа в существующий профиль
              </Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Никнейм"
                value={loginData.username}
                onChangeText={(text) => setLoginData({ ...loginData, username: text })}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TextInput
                style={styles.modalInput}
                placeholder="Пароль"
                value={loginData.password}
                onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowLoginModal(false);
                    setLoginData({ username: '', password: '' });
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleLogin}
                >
                  <Text style={styles.modalButtonTextPrimary}>Войти</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Профиль</Text>
          {currentUser && !isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>Редактировать</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {currentUser?.photo ? (
              <Image
                source={{ uri: currentUser.photo }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {formData.name.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
          </View>
          {!isEditing && (
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={handlePickImage}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.avatarButtonText}>
                  {currentUser?.photo ? 'Изменить фотографию' : 'Добавить фотографию'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <>
            <Input
              label="Имя"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ваше имя"
            />

            <Input
              label="Био"
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Коротко о себе..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Picker
              label="Город"
              value={formData.city}
              options={CITIES}
              onSelect={(value) => setFormData({ ...formData, city: value })}
              placeholder="Выберите город"
            />

            <Picker
              label="Пол"
              value={formData.gender}
              options={GENDER_OPTIONS}
              onSelect={(value) => setFormData({ ...formData, gender: value as Gender })}
              placeholder="Выберите пол"
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Контакты (приватные)</Text>
              <Text style={styles.sectionDescription}>
                Эти контакты видны только вам. Вы можете поделиться ими в чате одной кнопкой.
              </Text>
            </View>

            <Input
              label="Instagram"
              value={formData.instagram}
              onChangeText={(text) => setFormData({ ...formData, instagram: text })}
              placeholder="Ссылка на Instagram"
            />

            <Input
              label="Telegram"
              value={formData.telegram}
              onChangeText={(text) => setFormData({ ...formData, telegram: text })}
              placeholder="@username"
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Вход в профиль (необязательно)</Text>
              <Text style={styles.sectionDescription}>
                Заполните эти данные, чтобы не потерять доступ к профилю при переустановке приложения. 
                Никнейм должен быть уникальным.
              </Text>
            </View>

            <Input
              label="Никнейм"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholder="Придумайте уникальный никнейм"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Пароль"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Придумайте пароль"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Сохранить"
                onPress={handleSave}
              />
              <Button
                title="Отмена"
                onPress={() => {
                  setIsEditing(false);
                  if (currentUser) {
                    // Если есть пользователь, восстанавливаем его данные
                    setFormData({
                      name: currentUser.name,
                      bio: currentUser.bio || '',
                      city: currentUser.city,
                      gender: currentUser.gender || '' as Gender | '',
                      instagram: currentUser.instagram || '',
                      telegram: currentUser.telegram || '',
                      username: currentUser.username || '',
                      password: '', // Пароль не сохраняем
                    });
                  } else {
                    // Если нет пользователя, очищаем форму
                    setFormData({
                      name: '',
                      bio: '',
                      city: '',
                      gender: '' as Gender | '',
                      instagram: '',
                      telegram: '',
                      username: '',
                      password: '',
                    });
                  }
                }}
                variant="outline"
                style={styles.cancelButton}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{currentUser?.name}</Text>
              {currentUser?.bio && (
                <Text style={styles.bio}>{currentUser.bio}</Text>
              )}
              <Text style={styles.city}>📍 {currentUser?.city}</Text>
            </View>

            {!currentUser && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowLoginModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsButtonText}>Войти в старый профиль</Text>
                <Text style={styles.settingsButtonArrow}>›</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('Settings');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Заблокированные пользователи</Text>
              <Text style={styles.settingsButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleAboutApp}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>О приложении</Text>
              <Text style={styles.settingsButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleContactUs}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Связаться с нами</Text>
              <Text style={styles.settingsButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsButton, styles.deleteButton]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <Text style={[styles.settingsButtonText, styles.deleteButtonText]}>Удалить аккаунт</Text>
              <Text style={[styles.settingsButtonArrow, styles.deleteButtonText]}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Модальное окно для входа в старый профиль */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Вход в профиль</Text>
              <Text style={styles.modalSubtitle}>
                Введите никнейм и пароль для входа в существующий профиль
              </Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Никнейм"
                value={loginData.username}
                onChangeText={(text) => setLoginData({ ...loginData, username: text })}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TextInput
                style={styles.modalInput}
                placeholder="Пароль"
                value={loginData.password}
                onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowLoginModal(false);
                    setLoginData({ username: '', password: '' });
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleLogin}
                >
                  <Text style={styles.modalButtonTextPrimary}>Войти</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  editButton: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '500',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    ...typography.h1,
    color: colors.accent,
    fontSize: 40,
    lineHeight: 40,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  avatarButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  infoContainer: {
    alignItems: 'center',
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  city: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h2,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  settingsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  settingsButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  settingsButtonArrow: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },
  deleteButtonText: {
    color: colors.error,
    fontWeight: '600',
  },
});

