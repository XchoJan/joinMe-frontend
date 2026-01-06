import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Event, EventFormat, PaymentType } from '../types';
import { useApp } from '../context/AppContext';
import { Input } from '../components/Input';
import { Picker } from '../components/Picker';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/colors';

const FORMAT_OPTIONS: { label: string; value: EventFormat }[] = [
  { label: 'Кофе', value: 'coffee' },
  { label: 'Прогулка', value: 'walk' },
  { label: 'Обед', value: 'lunch' },
  { label: 'Ужин', value: 'dinner' },
  { label: 'Активность', value: 'activity' },
  { label: 'Другое', value: 'other' },
];

const PAYMENT_OPTIONS: { label: string; value: PaymentType }[] = [
  { label: 'Пополам', value: 'dutch' },
  { label: 'Я угощаю', value: 'my_treat' },
  { label: 'Ты угощаешь', value: 'your_treat' },
  { label: 'Бесплатно', value: 'free' },
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

export const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser, addEvent } = useApp();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  // Устанавливаем минимальную дату на вчера, чтобы сегодняшняя дата всегда была доступна
  const getMinimumDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  };
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  const todayStart = getTodayStart();
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(todayStart);
  const [selectedTime, setSelectedTime] = useState(now);
  const [minimumDate] = useState(getMinimumDate());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    location: '',
    date: formatDate(todayStart), // Автоматически устанавливаем сегодняшнюю дату
    time: formatTime(now), // Автоматически устанавливаем текущее время
    format: '' as EventFormat | '',
    paymentType: '' as PaymentType | '',
    participantLimit: '',
    currentParticipants: '1', // По умолчанию 1 (только автор)
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Сначала создайте профиль
          </Text>
          <Button
            title="Перейти в профиль"
            // @ts-ignore
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Введите название';
    if (!formData.description.trim()) newErrors.description = 'Введите описание';
    if (!formData.city) newErrors.city = 'Выберите город';
    if (!formData.location.trim()) newErrors.location = 'Введите место';
    if (!formData.date.trim()) newErrors.date = 'Введите дату';
    if (!formData.time.trim()) newErrors.time = 'Введите время';
    if (!formData.format) newErrors.format = 'Выберите формат';
    if (!formData.paymentType) newErrors.paymentType = 'Выберите, кто платит';
    if (!formData.participantLimit || parseInt(formData.participantLimit) < 1) {
      newErrors.participantLimit = 'Введите лимит участников (минимум 1)';
    } else if (parseInt(formData.participantLimit) === 0) {
      newErrors.participantLimit = 'Лимит участников не может быть 0';
    }
    
    const participantLimit = parseInt(formData.participantLimit) || 1;
    const currentParticipants = parseInt(formData.currentParticipants) || 1;
    
    if (!formData.currentParticipants || currentParticipants < 1) {
      newErrors.currentParticipants = 'Введите количество участников (минимум 1)';
    } else if (currentParticipants > participantLimit) {
      newErrors.currentParticipants = `Не может быть больше лимита (${participantLimit})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: any, date?: Date) => {
    // На Android проверяем тип события
    if (Platform.OS === 'android') {
      // Если событие 'dismissed', просто закрываем пикер без изменений
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
        return;
      }
      // Если событие 'set' и дата выбрана, обрабатываем
      if (event.type === 'set' && date) {
        // Проверяем, что выбранная дата не в прошлом
        const selectedDateStart = new Date(date);
        selectedDateStart.setHours(0, 0, 0, 0);
        const today = getTodayStart();
        
        if (selectedDateStart < today) {
          // Если выбрана прошедшая дата, показываем ошибку
          setErrors({ ...errors, date: 'Нельзя выбрать прошедшую дату' });
          setShowDatePicker(false);
          return;
        }
        
        setSelectedDate(date);
        setFormData({ ...formData, date: formatDate(date) });
        setErrors({ ...errors, date: '' });
        // Закрываем пикер после небольшой задержки, чтобы дата успела установиться
        setTimeout(() => {
          setShowDatePicker(false);
        }, 100);
        return;
      }
      // Если дата не передана, просто закрываем
      setShowDatePicker(false);
      return;
    }
    // На iOS обрабатываем как обычно
    if (date) {
      // Проверяем, что выбранная дата не в прошлом
      const selectedDateStart = new Date(date);
      selectedDateStart.setHours(0, 0, 0, 0);
      const today = getTodayStart();
      
      if (selectedDateStart < today) {
        // Если выбрана прошедшая дата, показываем ошибку
        setErrors({ ...errors, date: 'Нельзя выбрать прошедшую дату' });
        return;
      }
      
      setSelectedDate(date);
      setFormData({ ...formData, date: formatDate(date) });
      setErrors({ ...errors, date: '' });
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedTime(date);
      setFormData({ ...formData, time: formatTime(date) });
      setErrors({ ...errors, time: '' });
    }
  };

  const handleSubmit = async () => {
    if (!validate() || !currentUser) return;

    setLoading(true);

    try {
      // Формируем дату в формате ISO для бэкенда (YYYY-MM-DD)
      const formattedDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
      const formattedTime = formatTime(selectedTime);

      // Если введен лимит 1, автоматически отправляем 2
      let participantLimit = parseInt(formData.participantLimit);
      if (participantLimit === 1) {
        participantLimit = 2;
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        city: formData.city,
        location: formData.location.trim(),
        date: formattedDate,
        time: formattedTime,
        format: formData.format as EventFormat,
        paymentType: formData.paymentType as PaymentType,
        participantLimit: participantLimit,
        currentParticipants: parseInt(formData.currentParticipants) || 1,
        authorId: currentUser.id,
        authorGender: currentUser.gender,
      };

      await addEvent(eventData as any);
      
      // @ts-ignore
      navigation.navigate('MyEvents');
    } catch (error: any) {
      // Показываем ошибку пользователю
      alert(`Ошибка создания события: ${error?.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Создать событие</Text>
          </View>

          <Input
            label="Название"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Например: Кофе в центре"
            error={errors.title}
          />

          <Input
            label="Описание"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Расскажите о встрече..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            error={errors.description}
          />

          <Picker
            label="Город"
            value={formData.city}
            options={CITIES}
            onSelect={(value) => setFormData({ ...formData, city: value })}
            placeholder="Выберите город"
          />

          <Input
            label="Место"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            placeholder="Например: Кафе на Тверской"
            error={errors.location}
          />

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, errors.date && styles.labelError]}>
              Дата {errors.date && `• ${errors.date}`}
            </Text>
            <TouchableOpacity
              style={[styles.pickerButton, errors.date && styles.pickerButtonError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.pickerButtonText, !formData.date && styles.pickerButtonPlaceholder]}>
                {formData.date || 'ДД.ММ.ГГГГ'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={minimumDate}
                locale="ru-RU"
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <View style={styles.iosPickerButtons}>
                <TouchableOpacity
                  style={styles.iosPickerButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.iosPickerButtonText}>Готово</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, errors.time && styles.labelError]}>
              Время {errors.time && `• ${errors.time}`}
            </Text>
            <TouchableOpacity
              style={[styles.pickerButton, errors.time && styles.pickerButtonError]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.pickerButtonText, !formData.time && styles.pickerButtonPlaceholder]}>
                {formData.time || 'ЧЧ:ММ'}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                locale="ru-RU"
              />
            )}
            {Platform.OS === 'ios' && showTimePicker && (
              <View style={styles.iosPickerButtons}>
                <TouchableOpacity
                  style={styles.iosPickerButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.iosPickerButtonText}>Готово</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Picker
            label="Формат"
            value={formData.format}
            options={FORMAT_OPTIONS}
            onSelect={(value) => setFormData({ ...formData, format: value as EventFormat })}
            placeholder="Выберите формат"
          />

          <Picker
            label="Кто платит"
            value={formData.paymentType}
            options={PAYMENT_OPTIONS}
            onSelect={(value) => setFormData({ ...formData, paymentType: value as PaymentType })}
            placeholder="Выберите вариант"
          />

          <Input
            label="Сколько нас"
            value={formData.currentParticipants}
            onChangeText={(text) => setFormData({ ...formData, currentParticipants: text.replace(/[^0-9]/g, '') })}
            placeholder="1"
            keyboardType="numeric"
            error={errors.currentParticipants}
          />

          <Input
            label="Лимит участников"
            value={formData.participantLimit}
            onChangeText={(text) => {
              // Удаляем все нецифровые символы
              const numericText = text.replace(/[^0-9]/g, '');
              // Если введен 0, не сохраняем
              if (numericText === '0') {
                return;
              }
              setFormData({ ...formData, participantLimit: numericText });
            }}
            placeholder="2"
            keyboardType="numeric"
            error={errors.participantLimit}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Создать событие"
              onPress={handleSubmit}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  buttonContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
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
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  labelError: {
    color: colors.error,
  },
  pickerButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 50,
    justifyContent: 'center',
  },
  pickerButtonError: {
    borderColor: colors.error,
  },
  pickerButtonText: {
    ...typography.body,
    color: colors.text,
  },
  pickerButtonPlaceholder: {
    color: colors.textLight,
  },
  iosPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  iosPickerButton: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  iosPickerButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

