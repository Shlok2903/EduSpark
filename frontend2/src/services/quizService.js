import api from './api';

/**
 * Quiz services for managing course module quizzes
 */
const quizService = {
  // Get quiz metadata only (no questions)
  getQuizInfo: async (moduleId) => {
    try {
      const response = await api.get(`/api/quizzes/module/${moduleId}/info`);
      return response;
    } catch (error) {
      console.error('Error getting quiz info:', error);
      throw error;
    }
  },
  
  // Start a new quiz attempt
  startQuiz: async (moduleId) => {
    try {
      const response = await api.post(`/api/quizzes/module/${moduleId}/start`);
      return response;
    } catch (error) {
      console.error('Error starting quiz:', error);
      // Preserve error information for components
      if (error.response) {
        error.response.data = error.response.data || {};
        error.response.data.errorCode = error.response.data.errorCode || 'UNKNOWN_ERROR';
      }
      throw error;
    }
  },
  
  // Get questions for a specific attempt
  getQuizQuestions: (attemptId) => 
    api.get(`/api/quizzes/attempt/${attemptId}/questions`),
  
  // Get a specific quiz attempt
  getAttemptById: (attemptId) => 
    api.get(`/api/quizzes/attempt/${attemptId}`),
  
  // Get all attempts for a module
  getAttemptsByModule: (moduleId) => 
    api.get(`/api/quizzes/module/${moduleId}/attempts`),
  
  // Save quiz progress
  saveQuizProgress: (attemptId, data) => 
    api.post(`/api/quizzes/attempt/${attemptId}/save`, data),
  
  // Submit a quiz attempt
  submitQuiz: (attemptId) => 
    api.post(`/api/quizzes/attempt/${attemptId}/submit`),
  
  // Submit quiz answers
  submitQuizAnswers: (data) => 
    api.post('/api/quizzes/submit', data),
  
  // Update remaining time
  updateTimeRemaining: (attemptId, timeRemaining) => 
    api.put(`/api/quizzes/attempt/${attemptId}/time`, { timeRemaining })
};

export default quizService; 