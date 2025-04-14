import api from './api';

/**
 * Exam services for managing course exams
 */
const examService = {
  // Get exams by course
  getExamsByCourse: (courseId) => 
    api.get(`/exams/course/${courseId}`),
  
  // Get a specific exam
  getExamById: (examId) => 
    api.get(`/exams/${examId}`),
  
  // Create a new exam
  createExam: (examData) => 
    api.post('/exams/create', examData),
  
  // Update an exam
  updateExam: (examId, examData) => 
    api.put(`/exams/${examId}`, examData),
  
  // Delete an exam
  deleteExam: (examId) => 
    api.delete(`/exams/${examId}`),
  
  // Get exam attempts
  getExamAttempts: (examId) => 
    api.get(`/exams/${examId}/attempts`),
  
  // Get specific attempt
  getAttemptById: (attemptId) => 
    api.get(`/exams/attempts/${attemptId}`),
  
  // Grade an attempt
  gradeAttempt: (attemptId, gradeData) => 
    api.post(`/exams/attempts/${attemptId}/grade`, gradeData),
  
  // Update exam publish status
  publishExam: (examId, isPublished) => 
    api.put(`/exams/${examId}/publish`, { isPublished }),
    
  // Get all my exam attempts (student view)
  getMyAttempts: () => 
    api.get(`/exams/my/attempts`),

  // Start an exam attempt
  startExam: async (examId) => {
    try {
      const response = await api.post(`/exams/${examId}/start`);
      return response;
    } catch (error) {
      console.error('Error starting exam:', error);
      // Preserve the error data for the component to handle
      if (error.response) {
        error.response.data = error.response.data || {};
        error.response.data.errorCode = error.response.data.errorCode || 'UNKNOWN_ERROR';
      }
      throw error;
    }
  },
    
  // Submit an exam attempt
  submitExam: (attemptId) => 
    api.post(`/exams/attempt/${attemptId}/submit`),
    
  // Save exam progress
  saveExamProgress: (attemptId, data) => 
    api.post(`/exams/attempt/${attemptId}/save`, data),
    
  // Update remaining time
  updateTimeRemaining: (attemptId, timeRemaining) => 
    api.put(`/exams/attempt/${attemptId}/time`, { timeRemaining })
};

export default examService; 