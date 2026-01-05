import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Event } from '../types';
import { useApp } from '../context/AppContext';
import { EventCard } from '../components/EventCard';
import { Picker } from '../components/Picker';
import { colors, spacing, typography } from '../theme/colors';

const CITIES = [
  { label: 'Все города', value: 'all' },
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

export const EventsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { events, refreshEvents, loading } = useApp();
  const [selectedCity, setSelectedCity] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Загружаем события при монтировании компонента
  React.useEffect(() => {
    refreshEvents();
  }, []);

  // Загружаем события при изменении города
  React.useEffect(() => {
    refreshEvents(selectedCity === 'all' ? undefined : selectedCity);
  }, [selectedCity]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEvents(selectedCity === 'all' ? undefined : selectedCity);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredEvents = events;

  const handleEventPress = (event: Event) => {
    // @ts-ignore
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>События</Text>
      </View>

      <View style={styles.filterContainer}>
        <Picker
          label="Город"
          value={selectedCity}
          options={CITIES}
          onSelect={setSelectedCity}
          placeholder="Выберите город"
        />
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => handleEventPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedCity === 'all' 
                ? 'Пока нет активных событий'
                : `Нет событий в городе ${CITIES.find(c => c.value === selectedCity)?.label}`
              }
            </Text>
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
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
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
  },
});

