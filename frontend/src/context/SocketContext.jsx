import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth, API_BASE } from './AuthContext';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  // Fetch initial REST notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  // Handle Socket Connection & Listeners
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Real-time socket connection established.');
    });

    // Notification events
    newSocket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      if (Notification?.permission === 'granted') {
        new window.Notification('Task Management System', {
          body: notification.message,
        });
      }
    });

    // Message events
    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('message_updated', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    });

    // Inside useEffect socket event listeners:
    newSocket.on('message_unpinned', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    });

    newSocket.on('message_deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    newSocket.on('message_pinned', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    });

    // Presence & Typing events
    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    newSocket.on('typing', ({ user: typingUser }) => {
      setTypingUsers((prev) => (prev.includes(typingUser) ? prev : [...prev, typingUser]));
    });

    newSocket.on('stop_typing', ({ user: typingUser }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== typingUser));
    });

    newSocket.on('mentioned', (data) => {
      if (Notification?.permission === 'granted') {
        new window.Notification('You were mentioned', {
          body: data.message?.text || 'You have a new mention',
        });
      }
    });

    // Request browser notification permissions if not set
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [token, user]);

  // REST API Actions
  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const markAsRead = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const itemToDelete = notifications.find((n) => n._id === id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (itemToDelete && !itemToDelete.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Socket Emitters
  const joinRoom = (roomId) => socket?.emit('join_room', roomId);
  const leaveRoom = (roomId) => socket?.emit('leave_room', roomId);
  const sendMessage = (data) => socket?.emit('send_message', data);
  const startTyping = (roomId) => socket?.emit('typing', { roomId, user: user?.name });
  const stopTyping = (roomId) => socket?.emit('stop_typing', { roomId });
  const markMessageRead = (messageId) => socket?.emit('mark_read', { messageId });
  const editMessage = (messageId, text) => socket?.emit('edit_message', { messageId, text });
  const deleteMessage = (messageId) => socket?.emit('delete_message', { messageId });
  const pinMessage = (messageId) => socket?.emit('pin_message', { messageId });

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        fetchNotifications,
        markAllAsRead,
        markAsRead,
        deleteNotification,
        clearAllNotifications,
        messages,
        setMessages,
        onlineUsers,
        typingUsers,
        joinRoom,
        leaveRoom,
        sendMessage,
        startTyping,
        stopTyping,
        markMessageRead,
        editMessage,
        deleteMessage,
        pinMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to consume context safely
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};