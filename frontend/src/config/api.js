// API base URL
export const API_BASE_URL = 'https://newbackend-9u98.onrender.com';

// Axios configuration with retry logic for Render's cold start
export const axiosConfig = {
  timeout: 30000, // 30 seconds
  retryDelay: 1000, // 1 second
  maxRetries: 3
};

// API endpoints
export const endpoints = {
  login: `${API_BASE_URL}/api/login`,
  signup: `${API_BASE_URL}/api/signup`,
  blinks: `${API_BASE_URL}/api/blinks`,
  users: `${API_BASE_URL}/api/users`,
  friendRequests: `${API_BASE_URL}/api/friend-requests`,
  friendRequest: `${API_BASE_URL}/api/friend-request`,
  friends: `${API_BASE_URL}/api/friends`,
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