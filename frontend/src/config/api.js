import axios from 'axios';

// ========================================
// API CONFIGURATION
// ========================================
// Get API URL from environment variables
// For development: http://localhost:5000 (from .env.development)
// For production: https://groot-kscp.onrender.com (from .env.production)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create centralized axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios configuration with retry logic for Render's cold start
export const axiosConfig = {
  timeout: 30000, // 30 seconds
  retryDelay: 1000, // 1 second
  maxRetries: 3
};

// API endpoints - now using environment-based baseURL
export const endpoints = {
  login: '/api/login',
  signup: '/api/signup',
  blinks: '/api/blinks',
  users: '/api/users',
  friendRequests: '/api/friend-requests',
  friendRequest: '/api/friend-request',
  friends: '/api/friends',
};

// Helper function to handle API errors with retry logic
export const handleApiError = async (error, retryCount = 0) => {
  console.error('API Error:', error);
  
  // If the error is due to connection refused and we haven't exceeded max retries
  if (error.code === 'ERR_CONNECTION_REFUSED' && retryCount < axiosConfig.maxRetries) {
    console.log(`Retrying request (${retryCount + 1}/${axiosConfig.maxRetries})...`);
    await new Promise(resolve => setTimeout(resolve, axiosConfig.retryDelay));
    return 'retrying';
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return 'Unable to connect to server. Please try again.';
};
  }
  return 'Unable to connect to server. Please try again.';
};