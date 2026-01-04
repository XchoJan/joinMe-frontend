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
  const { currentUser, setCurrentUser, loadUser } = useApp();
  const [isEditing, setIsEditing] = useState(!currentUser);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    city: currentUser?.city || '',
    gender: currentUser?.gender || '' as Gender | '',
    instagram: currentUser?.instagram || '',
    telegram: currentUser?.telegram || '',
  });


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

  const handleContactUs = () => {
    Alert.alert(
      'Связаться с нами',
      'Выберите способ связи',
      [
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:support@joinme.app').catch(() => {
              Alert.alert('Ошибка', 'Не удалось открыть почтовое приложение');
            });
          },
        },
        {
          text: 'Telegram',
          onPress: () => {
            Linking.openURL('https://t.me/joinme_support').catch(() => {
              Alert.alert('Ошибка', 'Не удалось открыть Telegram');
            });
          },
        },
        {
          text: 'Отмена',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.city) {
      return;
    }

    const user = {
      id: currentUser?.id || `user_${Date.now()}`,
      name: formData.name.trim(),
      bio: formData.bio.trim(),
      city: formData.city,
      gender: formData.gender || undefined,
      instagram: formData.instagram.trim() || undefined,
      telegram: formData.telegram.trim() || undefined,
      photo: currentUser?.photo, // Сохраняем фото
    };

    setCurrentUser(user);
    setIsEditing(false);
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
        </View>
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

            <View style={styles.buttonContainer}>
              <Button
                title="Сохранить"
                onPress={handleSave}
              />
              {currentUser && (
                <Button
                  title="Отмена"
                  onPress={() => {
                    setIsEditing(false);
                    setFormData({
                      name: currentUser.name,
                      bio: currentUser.bio || '',
                      city: currentUser.city,
                      instagram: currentUser.instagram || '',
                      telegram: currentUser.telegram || '',
                    });
                  }}
                  variant="outline"
                  style={styles.cancelButton}
                />
              )}
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
          </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
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
});

