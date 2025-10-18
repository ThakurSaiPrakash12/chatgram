// API Configuration for different environments
// This file centralizes all API endpoints

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Base URLs
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  UPDATE_ABOUT: `${API_BASE_URL}/api/auth/update-about`,
  UPLOAD_PROFILE_PIC: `${API_BASE_URL}/api/auth/upload-profile-pic`,
  
  // Chat endpoints
  GET_CHATS: `${API_BASE_URL}/api/chat`,
  CREATE_CHAT: `${API_BASE_URL}/api/chat`,
  CREATE_GROUP: `${API_BASE_URL}/api/chat/group`,
  ADD_GROUP_MEMBER: (chatId) => `${API_BASE_URL}/api/chat/${chatId}/add-member`,
  REMOVE_GROUP_MEMBER: (chatId) => `${API_BASE_URL}/api/chat/${chatId}/remove-member`,
  LEAVE_GROUP: (chatId) => `${API_BASE_URL}/api/chat/${chatId}/leave`,
  UPDATE_GROUP_NAME: (chatId) => `${API_BASE_URL}/api/chat/${chatId}/update-name`,
  
  // Message endpoints
  GET_MESSAGES: (chatId) => `${API_BASE_URL}/api/message/${chatId}`,
  SEND_MESSAGE: `${API_BASE_URL}/api/message`,
  SEND_IMAGE: `${API_BASE_URL}/api/message/image`,
};

// Socket.IO configuration
export const SOCKET_CONFIG = {
  url: SOCKET_URL,
  options: {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    // For production, we might need additional CORS settings
    ...(isProduction && {
      withCredentials: true,
      extraHeaders: {
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${imagePath}`;
};

// Log current configuration in development
if (isDevelopment) {
  console.log('🔧 API Configuration:');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Socket URL:', SOCKET_URL);
  console.log('Environment:', import.meta.env.MODE);
}

export default {
  API_BASE_URL,
  SOCKET_URL,
  API_ENDPOINTS,
  SOCKET_CONFIG,
  getImageUrl
};
