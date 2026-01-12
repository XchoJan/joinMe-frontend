import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';

// Socket URL для локальной разработки
const getSocketUrl = () => {
  if (Platform.OS === 'android') {
    // Для Android эмулятора
    return 'http://10.0.2.2:3000';
    // Для реального Android устройства укажите IP вашего компьютера:
    // return 'http://192.168.1.XXX:3000'; // Замените XXX на ваш IP
  }
  // Для iOS симулятора
  return 'http://localhost:3000';
  
  // Продакшен URL (закомментирован для локальной разработки):
  // return 'https://musicialconnect.com/socket.io/';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private joinedChats: Set<string> = new Set();

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      // Socket connection error
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.joinedChats.clear();
    }
  }

  async joinChat(chatId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket) {
        this.connect();
      }

      if (this.joinedChats.has(chatId)) {
        resolve(true);
        return;
      }

      const onConnect = () => {
        if (this.socket) {
          this.socket.emit('join_chat', { chatId }, (response: any) => {
            if (response?.status === 'joined') {
              this.joinedChats.add(chatId);
              this.socket?.off('connect', onConnect);
              resolve(true);
            } else {
              resolve(false);
            }
          });
        }
      };

      if (this.socket?.connected) {
        this.socket.emit('join_chat', { chatId }, (response: any) => {
          if (response?.status === 'joined') {
            this.joinedChats.add(chatId);
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } else {
        this.socket?.once('connect', onConnect);
        // Таймаут на случай, если соединение не установится
        setTimeout(() => {
          this.socket?.off('connect', onConnect);
          resolve(false);
        }, 5000);
      }
    });
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_chat', { chatId });
    }
    this.joinedChats.delete(chatId);
  }

  async sendMessage(chatId: string, userId: string, text: string): Promise<boolean> {
    // Убеждаемся, что мы в комнате чата
    if (!this.joinedChats.has(chatId)) {
      const joined = await this.joinChat(chatId);
      if (!joined) {
        return false;
      }
    }

    if (this.socket?.connected) {
      return new Promise((resolve) => {
        this.socket!.emit('send_message', { chatId, userId, text }, (response: any) => {
          if (response?.status === 'sent') {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    }
    return false;
  }

  onNewMessage(callback: (data: { chatId: string; message: any }) => void) {
    if (!this.socket) {
      this.connect();
    }
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  offNewMessage(callback?: (data: { chatId: string; message: any }) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('new_message', callback);
      } else {
        this.socket.off('new_message');
      }
    }
  }

  onMessageDeleted(callback: (data: { chatId: string; messageId: string }) => void) {
    if (this.socket) {
      this.socket.on('message_deleted', callback);
    }
  }

  offMessageDeleted(callback?: (data: { chatId: string; messageId: string }) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('message_deleted', callback);
      } else {
        this.socket.off('message_deleted');
      }
    }
  }

  onAllMessagesDeleted(callback: (data: { chatId: string }) => void) {
    if (this.socket) {
      this.socket.on('all_messages_deleted', callback);
    }
  }

  offAllMessagesDeleted(callback?: (data: { chatId: string }) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('all_messages_deleted', callback);
      } else {
        this.socket.off('all_messages_deleted');
      }
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();

