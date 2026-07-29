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

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------- Chat Rooms ----------------

export const getChatRooms = async () => {
  const response = await apiClient.get('/chat/rooms');
  return response.data;
};

export const createRoom = async (data) => {
  const response = await apiClient.post('/chat/rooms', data);
  return response.data;
};

// ---------------- Messages ----------------

export const getMessages = async (roomId) => {
  const response = await apiClient.get(`/chat/${roomId}/messages`);
  return response.data;
};

export const sendMessage = async (data) => {
  const response = await apiClient.post('/chat/send', data);
  return response.data;
};

// ---------------- Room Members ----------------

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
};