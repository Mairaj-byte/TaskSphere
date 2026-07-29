<<<<<<< HEAD
import axios from "axios";
import { API_BASE, useAuth } from "../context/AuthContext";

export const useChatApi = () => {
  const { token } = useAuth();

  const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  return {
    // ---------------- Chat Rooms ----------------
    getChatRooms: async () =>
      (await apiClient.get("/chat/rooms")).data,
=======
import axios from 'axios';
import { API_BASE } from '../context/AuthContext';

// 1. Reusable axios instance — reuses the same env-based API_BASE as the
// rest of the app (VITE_API_BASE, falling back to localhost only in dev).
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: injects the *real* logged-in user's token into
// every request. This runs outside the React tree (axios interceptors
// aren't components), so we can't call useAuth() here — instead we read
// straight from localStorage using the same key AuthContext writes to
// ("task_tracker_token"), which always reflects whoever is currently
// logged in.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("task_tracker_token");
>>>>>>> ded4c195157095147088607afa6873fe066a09c2

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

<<<<<<< HEAD
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
=======
export const addMember = async (roomId, email) => {
  const response = await apiClient.post(`/chat/${roomId}/add-member`, { email });
  return response.data;
};

export const removeMember = async (roomId, userId) => {
  const response = await apiClient.delete(`/chat/${roomId}/remove-member/${userId}`);
  return response.data;
};

// ---------------- Message Actions ----------------

export const markMessageRead = async (messageId) => {
  const response = await apiClient.patch(`/chat/message/${messageId}/read`);
  return response.data;
};

export const editMessage = async (messageId, text) => {
  const response = await apiClient.patch(`/chat/message/${messageId}/edit`, { text });
  return response.data;
};

export const pinMessage = async (messageId) => {
  const response = await apiClient.patch(`/chat/message/${messageId}/pin`);
  return response.data;
};

export const unpinMessage = async (messageId) => {
  const response = await apiClient.patch(`/chat/message/${messageId}/unpin`);
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await apiClient.delete(`/chat/message/${messageId}`);
  return response.data;
>>>>>>> ded4c195157095147088607afa6873fe066a09c2
};