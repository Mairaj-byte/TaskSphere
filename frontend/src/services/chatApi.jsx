import axios from 'axios';
import { API_BASE } from '../context/AuthContext';

// 1. Reusable axios instance — reuses the same env-based API_BASE as the
// rest of the app.
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: injects the real logged-in user's token into
// every request by reading straight from localStorage.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("task_tracker_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useChatApi = () => {
  return {
    // ---------------- Chat Rooms ----------------
    getChatRooms: async () =>
      (await apiClient.get("/chat/rooms")).data,

    createRoom: async (data) =>
      (await apiClient.post("/chat/rooms", data)).data,

    // ---------------- Messages ----------------
    getMessages: async (roomId) =>
      (await apiClient.get(`/chat/${roomId}/messages`)).data,

    // Normal message
    sendMessage: async (data) =>
      (await apiClient.post("/chat/send", data)).data,

    // Message with mentions
    sendMessageWithMentions: async (data) =>
      (await apiClient.post("/chat/messages", data)).data,

    // ---------------- Mention Search ----------------
    searchMentionUsers: async (roomId, query = "") =>
      (
        await apiClient.post("/chat/users/search", {
          roomId,
          query,
        })
      ).data,

    // ---------------- Room Members ----------------
    addMember: async (roomId, email) =>
      (
        await apiClient.post(`/chat/${roomId}/add-member`, {
          email,
        })
      ).data,

    removeMember: async (roomId, userId) =>
      (
        await apiClient.delete(
          `/chat/${roomId}/remove-member/${userId}`
        )
      ).data,

    // ---------------- Message Actions ----------------
    markMessageRead: async (messageId) =>
      (
        await apiClient.patch(`/chat/message/${messageId}/read`)
      ).data,

    editMessage: async (messageId, text) =>
      (
        await apiClient.patch(`/chat/message/${messageId}/edit`, {
          text,
        })
      ).data,

    pinMessage: async (messageId) =>
      (
        await apiClient.patch(`/chat/message/${messageId}/pin`)
      ).data,

    unpinMessage: async (messageId) =>
      (
        await apiClient.patch(`/chat/message/${messageId}/unpin`)
      ).data,

    deleteMessage: async (messageId) =>
      (
        await apiClient.delete(`/chat/message/${messageId}`)
      ).data,
  };
};