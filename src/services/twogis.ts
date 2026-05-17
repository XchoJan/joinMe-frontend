import axios from 'axios';
import { Platform } from 'react-native';

// Базовый URL бэкенда
const getApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Для Android эмулятора
    return 'http://10.0.2.2:4000/api';
    // Для реального Android устройства укажите IP вашего компьютера:
    // return 'http://192.168.1.XXX:4000/api'; // Замените XXX на ваш IP
  }
  // Для iOS симулятора
  return 'http://localhost:4000/api';
  
  // Продакшен URL (закомментирован для локальной разработки):
  // return 'https://musicialconnect.com/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface Venue {
  id: string;
  name: string;
  city: string;
  address?: string;
  point?: {
    lat: number;
    lon: number;
  };
  rubrics?: Array<{
    id: string;
    name: string;
  }>;
  photos?: Array<{
    prefix: string;
    suffix: string;
  }>;
}

export interface VenueSearchParams {
  q?: string;
  city?: string;
  rubric_id?: string;
  page?: number;
  page_size?: number;
}

export interface VenueSearchResponse {
  result: {
    items: Array<{
      id: string;
      name: string;
      address_name?: string;
      point?: {
        lat: number;
        lon: number;
      };
      rubrics?: Array<{
        id: string;
        name: string;
      }>;
      photos?: Array<{
        prefix: string;
        suffix: string;
      }>;
    }>;
    total: number;
    page: number;
    page_size: number;
  };
}

class TwoGisService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/twogis`;
  }

  /**
   * Получить список городов для поиска
   */
  async getCities(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/cities`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Получить список рубрик (категорий заведений)
   */
  async getRubrics(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/rubrics`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  }


  /**
   * Поиск заведений через бэкенд API (который проксирует запросы к 2ГИС)
   */
  async searchVenues(params: VenueSearchParams): Promise<VenueSearchResponse | null> {
    try {
      const searchParams: any = {
        page: params.page || 1,
        // API 2ГИС ограничивает page_size от 1 до 10
        page_size: Math.min(params.page_size || 10, 10),
      };

      // Добавляем параметры поиска
      if (params.q) {
        searchParams.q = params.q;
      }

      if (params.city && params.city !== '' && params.city !== 'Все города') {
        searchParams.city = params.city;
      }

      if (params.rubric_id && params.rubric_id !== '') {
        searchParams.rubric_id = params.rubric_id;
      }

      const response = await axios.get(`${this.baseUrl}/venues/search`, {
        params: searchParams,
      });

      // Проверяем ответ
      if (response.data?.meta?.error) {
        return null;
      }

      if (response.data?.result) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Получить детальную информацию о заведении
   */
  async getVenueDetails(venueId: string, city?: string): Promise<Venue | null> {
    try {
      const params: any = {};

      if (city) {
        params.city = city;
      }

      const response = await axios.get(`${this.baseUrl}/venues/${venueId}`, {
        params,
      });

      const item = response.data;
      if (!item) return null;

      return {
        id: item.id,
        name: item.name,
        city: city || '',
        address: item.address_name,
        point: item.point,
        rubrics: item.rubrics,
        photos: item.photos,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Получить URL изображения заведения
   */
  getVenueImageUrl(photo: { prefix: string; suffix: string }): string {
    return `${photo.prefix}${photo.suffix}`;
  }
}

export const twoGisService = new TwoGisService();

