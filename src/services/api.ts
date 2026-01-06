import { Platform } from 'react-native';

// Для Android эмулятора используем 10.0.2.2 вместо localhost
// Для реального Android устройства используйте IP адрес вашего компьютера
const getApiBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Для Android эмулятора
      return 'http://10.0.2.2:3000';
      // Для реального Android устройства раскомментируйте и укажите IP вашего компьютера:
      // return 'http://192.168.1.XXX:3000'; // Замените XXX на ваш IP
    }
    // Для iOS симулятора
    return 'http://localhost:3000';
  }
  // Production URL
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  public baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    // Добавляем префикс /api ко всем эндпоинтам (кроме статических файлов)
    const apiEndpoint = endpoint.startsWith('/uploads/') ? endpoint : `/api${endpoint}`;
    const url = `${this.baseUrl}${apiEndpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            if (Array.isArray(errorData.message)) {
              errorMessage = errorData.message.join(', ');
            } else {
              errorMessage = errorData.message;
            }
          }
        } catch (e) {
          // Если не удалось распарсить JSON, используем статус
          errorMessage = `API Error ${response.status}: ${response.statusText}`;
        }
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      try {
        // Проверяем, есть ли контент для парсинга
        const contentType = response.headers.get('content-type');
        const text = await response.text();
        
        // Если ответ пустой, возвращаем null для некоторых эндпоинтов
        if (!text || text.trim() === '') {
          if (response.status === 404) {
            const error: any = new Error('Not found');
            error.status = 404;
            throw error;
          }
          // Для других статусов возвращаем null, если это ожидаемо
          if (response.status === 200 || response.status === 201) {
            return null;
          }
        }
        
        // Пытаемся распарсить JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          // Если не удалось распарсить, но статус успешный, возвращаем null
          if (response.status >= 200 && response.status < 300) {
            return null;
          }
          throw parseError;
        }
        
        // Логируем ответ для getUser, чтобы проверить наличие premium
        if (endpoint.includes('/users/') && !endpoint.includes('/block') && !endpoint.includes('/fcm-token')) {
          console.log('API getUser response:', data);
          console.log('API getUser premium field:', data?.premium);
        }
        return data;
      } catch (jsonError: any) {
        console.error('Error parsing JSON response:', jsonError);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        
        // Если это уже ошибка со статусом, пробрасываем её дальше
        if (jsonError.status) {
          throw jsonError;
        }
        
        const error: any = new Error(`Failed to parse JSON response: ${jsonError?.message || jsonError}`);
        error.status = response.status;
        error.originalError = jsonError;
        throw error;
      }
    } catch (fetchError: any) {
      // Обрабатываем сетевые ошибки
      console.error('Fetch error:', fetchError);
      if (fetchError.message && fetchError.message.includes('Internal server')) {
        // Если это уже обработанная ошибка, пробрасываем дальше
        throw fetchError;
      }
      const error: any = new Error(fetchError?.message || 'Network error');
      error.originalError = fetchError;
      throw error;
    }
  }

  // Users
  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    return this.request(`/users/${userId}/fcm-token`, {
      method: 'PUT',
      body: JSON.stringify({ fcmToken }),
    });
  }

  async blockUser(blockerId: string, blockedUserId: string) {
    return this.request(`/users/${blockerId}/block`, {
      method: 'POST',
      body: JSON.stringify({ blockedUserId }),
    });
  }

  async unblockUser(blockerId: string, blockedUserId: string) {
    return this.request(`/users/${blockerId}/unblock`, {
      method: 'POST',
      body: JSON.stringify({ blockedUserId }),
    });
  }

  async getBlockedUsers(blockerId: string) {
    return this.request(`/users/${blockerId}/blocked`);
  }

  async isBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    const result = await this.request<{ blocked: boolean }>(`/users/${blockerId}/is-blocked/${blockedUserId}`);
    return result.blocked;
  }

  async login(username: string, password: string) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async uploadAvatar(fileUri: string, oldPhotoUrl?: string): Promise<{ url: string }> {
    const formData = new FormData();
    
    // Для React Native нужно использовать правильный формат
    const file = {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    };
    
    formData.append('file', file as any);
    
    if (oldPhotoUrl) {
      formData.append('oldPhotoUrl', oldPhotoUrl);
    }

    const response = await fetch(`${this.baseUrl}/api/upload/avatar`, {
      method: 'POST',
      body: formData,
      // Не устанавливаем Content-Type вручную, браузер/React Native установит его автоматически с boundary
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else {
            errorMessage = errorData.message;
          }
        }
      } catch (e) {
        errorMessage = `API Error ${response.status}: ${response.statusText}`;
      }
      const error: any = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  // Events
  async createEvent(eventData: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getEvents(city?: string) {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.request(`/events${query}`);
  }

  async getEvent(id: string) {
    return this.request(`/events/${id}`);
  }

  async getMyEvents(authorId: string) {
    return this.request(`/events/my/${authorId}`);
  }

  async getMyParticipations(userId: string) {
    return this.request(`/events/participant/${userId}`);
  }

  async deleteEvent(eventId: string, authorId: string) {
    return this.request(`/events/${eventId}/delete`, {
      method: 'PUT',
      body: JSON.stringify({ authorId }),
    });
  }

  async createEventRequest(eventId: string, userId: string) {
    return this.request(`/events/${eventId}/requests`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getEventRequests(eventId: string) {
    return this.request(`/events/${eventId}/requests`);
  }

  async approveRequest(requestId: string) {
    return this.request(`/events/requests/${requestId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectRequest(requestId: string) {
    return this.request(`/events/requests/${requestId}/reject`, {
      method: 'PUT',
    });
  }

  async removeParticipant(eventId: string, userId: string, authorId: string) {
    return this.request(`/events/participants/remove`, {
      method: 'POST',
      body: JSON.stringify({ eventId, userId, authorId }),
    });
  }

  async leaveEvent(eventId: string, userId: string) {
    return this.request(`/events/${eventId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Chats
  async getChat(id: string) {
    return this.request(`/chats/${id}`);
  }

  async getChatByEvent(eventId: string) {
    return this.request(`/chats/event/${eventId}`);
  }

  async getMessages(chatId: string) {
    return this.request(`/chats/${chatId}/messages`);
  }

  async sendMessage(chatId: string, userId: string, text: string) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ userId, text }),
    });
  }

  async deleteMessage(chatId: string, messageId: string, userId: string) {
    return this.request(`/chats/${chatId}/messages/${messageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }

  async deleteAllMessages(chatId: string, userId: string) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }
}

export const api = new ApiService();

