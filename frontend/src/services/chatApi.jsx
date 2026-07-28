import axios from 'axios';
import { API_BASE, useAuth } from '../context/AuthContext';

export const useChatApi = () => {
  const { token } = useAuth();

  const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  return {
    // ---------------- Chat Rooms ----------------
    getChatRooms: async () => (await apiClient.get('/chat/rooms')).data,
    createRoom: async (data) => (await apiClient.post('/chat/rooms', data)).data,

    // ---------------- Messages ----------------
    getMessages: async (roomId) => (await apiClient.get(`/chat/${roomId}/messages`)).data,
    sendMessage: async (data) => (await apiClient.post('/chat/send', data)).data,

    // ---------------- Room Members ----------------
    addMember: async (roomId, email) => (await apiClient.post(`/chat/${roomId}/add-member`, { email })).data,
    removeMember: async (roomId, userId) => (await apiClient.delete(`/chat/${roomId}/remove-member/${userId}`)).data,

    // ---------------- Message Actions ----------------
    markMessageRead: async (messageId) => (await apiClient.patch(`/chat/message/${messageId}/read`)).data,
    editMessage: async (messageId, text) => (await apiClient.patch(`/chat/message/${messageId}/edit`, { text })).data,
    pinMessage: async (messageId) => (await apiClient.patch(`/chat/message/${messageId}/pin`)).data,
    unpinMessage: async (messageId) => (await apiClient.patch(`/chat/message/${messageId}/unpin`)).data,
    deleteMessage: async (messageId) => (await apiClient.delete(`/chat/message/${messageId}`)).data,
  };
};