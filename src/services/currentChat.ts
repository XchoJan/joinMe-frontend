// Модуль для хранения текущего открытого чата
let currentOpenChatId: string | null = null;

export const setCurrentOpenChatId = (chatId: string | null) => {
  currentOpenChatId = chatId;
};

export const getCurrentOpenChatId = (): string | null => {
  return currentOpenChatId;
};

