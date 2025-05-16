import axios from 'axios';

// Ensure we have http:// in the URL
const baseURL = 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout and response type options
  timeout: 30000, // 30 seconds
  responseType: 'json', // Default for normal requests
});

// Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set responseType to 'blob' for PDF requests
    if (config.url.includes('/api/books/pdf/')) {
      config.responseType = 'blob';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance; 