import axios from 'axios';
import courseService from './courseService';
import enrollmentService from './enrollmentService';
import authService from './authService';
import sectionService from './sectionService';
import moduleService from './moduleService';
import examService from './examService';
import quizService from './quizService';
import studentService from './studentService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Create axios instance with common config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common response patterns
api.interceptors.response.use(
  (response) => {
    // Return only the data part of the response by default
    return response.data;
  },
  (error) => {
    // Handle unauthorized errors (token expired)
    if (error.response && error.response.status === 403) {
      // Check if it's a token issue
      if (error.response.data.message && error.response.data.message.includes('JWT token is wrong or expired')) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    // Format the error message for easier handling
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    error.formattedMessage = errorMessage;
    
    return Promise.reject(error);
  }
);

// Export API services as a combined object
export {
  courseService,
  enrollmentService,
  authService,
  sectionService,
  moduleService,
  examService,
  quizService,
  studentService
};

export default api; 