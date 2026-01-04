export type EventFormat = 'coffee' | 'walk' | 'lunch' | 'dinner' | 'activity' | 'other';
export type PaymentType = 'dutch' | 'my_treat' | 'your_treat' | 'free';

export type Gender = 'male' | 'female';

export interface User {
  id: string;
  name: string;
  photo?: string;
  bio?: string;
  instagram?: string;
  telegram?: string;
  city: string;
  gender?: Gender;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  date: string; // ISO date string
  time: string;
  format: EventFormat;
  paymentType: PaymentType;
  participantLimit: number;
  currentParticipants?: number; // Сколько человек уже есть
  authorId: string;
  authorGender?: Gender;
  createdAt: string;
  participants?: string[]; // user IDs
  requests?: string[]; // user IDs who requested to join
  status: 'active' | 'completed' | 'cancelled';
}

export interface Chat {
  id: string;
  eventId: string;
  participants: string[]; // user IDs
  messages: Message[];
  createdAt: string;
}

export interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface EventRequest {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

