import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { twoGisService, Venue } from '../services/twogis';
import { Picker } from '../components/Picker';
import { colors, spacing, typography } from '../theme/colors';
import NoIcon from '../assets/icons/NoIcon';
// Категории заведений (рубрики 2ГИС)
const RUBRIC_OPTIONS = [
  { label: 'Все категории', value: '' },
  { label: 'Кафе', value: '184106343' }, // ID рубрики "Кафе" в 2ГИС
  { label: 'Рестораны', value: '184106394' },
  { label: 'Бары', value: '184106392' },
  { label: 'Пиццерии', value: '184106390' },
  { label: 'Суши', value: '184106395' },
  { label: 'Бургерные', value: '184106391' },
  { label: 'Кофейни', value: '184106344' },
  { label: 'Пабы', value: '184106393' },
];

// Города (можно расширить список)
const CITY_OPTIONS = [
  { label: 'Все города', value: '' },
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

interface VenueItem {
  id: string;
  name: string;
  address?: string;
  city: string;
  photoUrl?: string;
}

export const SelectVenueScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const loadVenues = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    // Не делаем запрос если уже загружаем или достигли лимита страниц
    if (loading || loadingMore || pageNum > 5) {
      if (pageNum > 5) {
        setHasMore(false);
      }
      return;
    }

    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await twoGisService.searchVenues({
        city: selectedCity || undefined,
        rubric_id: selectedRubric || undefined,
        page: pageNum,
        page_size: 10, // API 2ГИС ограничивает до 10 заведений на страницу
      });

      if (response?.result) {
        const items: VenueItem[] = response.result.items.map((item) => ({
          id: item.id,
          name: item.name,
          address: item.address_name,
          city: selectedCity || 'Не указан',
          photoUrl: item.photos?.[0]
            ? twoGisService.getVenueImageUrl(item.photos[0])
            : undefined,
        }));

        if (reset) {
          setVenues(items);
          // Проверяем, есть ли еще данные для загрузки
          // API 2ГИС ограничивает page до 5, поэтому проверяем и это тоже
          const loadedCount = items.length;
          const totalCount = response.result.total;
          const maxPage = 5; // API ограничивает до 5 страниц
          // Если загрузили меньше 10 или достигли лимита страниц, больше данных нет
          const hasMoreData = loadedCount === 10 && loadedCount < totalCount && pageNum < maxPage;
          setHasMore(hasMoreData);
        } else {
          setVenues((prev) => {
            const newVenues = [...prev, ...items];
            // Проверяем, есть ли еще данные для загрузки
            const loadedCount = newVenues.length;
            const totalCount = response.result.total;
            const maxPage = 5; // API ограничивает до 5 страниц
            // Если загрузили меньше 10 или достигли лимита страниц, больше данных нет
            const hasMoreData = items.length === 10 && loadedCount < totalCount && pageNum < maxPage;
            setHasMore(hasMoreData);
            return newVenues;
          });
        }

        setTotal(response.result.total);
        setPage(pageNum);
      } else {
        // Если ответ пустой или нет данных, больше загружать нечего
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error loading venues:', error);
      // При любой ошибке API останавливаем загрузку, чтобы не было бесконечных запросов
      setHasMore(false);
      
      // Логируем детали ошибки для отладки
      if (error.response?.data?.meta?.error) {
        const errorMessage = error.response.data.meta.error.message || '';
        console.error('2GIS API error:', errorMessage);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [selectedCity, selectedRubric, loading, loadingMore]);

  useEffect(() => {
    loadVenues(1, true);
  }, [selectedCity, selectedRubric]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadVenues(1, true);
  };

  const handleLoadMore = () => {
    // Проверяем все условия перед загрузкой
    if (loadingMore || !hasMore || page >= 5) {
      return; // Не загружаем если уже загружаем, нет данных или достигли лимита API
    }
    loadVenues(page + 1, false);
  };

  const handleVenueSelect = (venue: VenueItem) => {
    // @ts-ignore
    navigation.navigate('CreateEvent', {
      venueName: venue.name,
      venueCity: venue.city,
    });
  };

  const renderVenue = ({ item }: { item: VenueItem }) => (
    <TouchableOpacity
      style={styles.venueCard}
      onPress={() => handleVenueSelect(item)}
      activeOpacity={0.7}
    >
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.venueImage} />
      ) : (
        <View style={[styles.venueImage, styles.venueImagePlaceholder]}>
          <Text style={styles.venueImagePlaceholderText}>
              <NoIcon/>
            </Text>
        </View>
      )}
      <View style={styles.venueInfo}>
        <Text style={styles.venueName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.address && (
          <Text style={styles.venueAddress} numberOfLines={1}>
            {item.address}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Выберите заведение</Text>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Picker
              label="Категория"
              value={selectedRubric}
              options={RUBRIC_OPTIONS}
              onSelect={(value) => {
                setSelectedRubric(value);
                setPage(1);
                setHasMore(true);
              }}
              placeholder="Все категории"
            />
          </View>
          <View style={styles.filterItem}>
            <Picker
              label="Город"
              value={selectedCity}
              options={CITY_OPTIONS}
              onSelect={(value) => {
                setSelectedCity(value);
                setPage(1);
                setHasMore(true);
              }}
              placeholder="Все города"
            />
          </View>
        </View>
      </View>

      {loading && venues.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Загрузка заведений...</Text>
        </View>
      ) : venues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Заведения не найдены</Text>
          <Text style={styles.emptySubtext}>
            Попробуйте изменить фильтры поиска
          </Text>
        </View>
      ) : (
        <FlatList
          data={venues}
          renderItem={renderVenue}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  filtersContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  filterItem: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  venueCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 120,
  },
  venueImage: {
    width: '100%',
    height: 60,
    backgroundColor: colors.borderLight,
  },
  venueImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueImagePlaceholderText: {
    fontSize: 24,
  },
  venueInfo: {
    padding: spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  venueName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  venueAddress: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 11,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loaderText: {
    ...typography.body,
    color: colors.textSecondary,
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
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

