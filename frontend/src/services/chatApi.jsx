import axios from 'axios';

const API_BASE = "http://localhost:5000/api";

// 1. Create a reusable axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: Injects the token into every single request automatically
apiClient.interceptors.request.use((config) => {
  // Use this for testing with your hardcoded token:
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTYxY2M0NjFhZWMwMTk0NjJlMzkwYzYiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODUxNjE4ODksImV4cCI6MTc4NTc2NjY4OX0.JvG7EkUIfYBEHTXogHR8BIgaZJcMX7VWDEDTBFlPZVs";
  
  // Or switch to this once you are ready for dynamic storage:
  // const token = localStorage.getItem("token");

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

// services/chatApi.js

// Change the function to accept email and send it in the body
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

