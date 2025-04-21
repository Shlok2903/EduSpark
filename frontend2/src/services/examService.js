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
    api.get(`/exams/attempt/${attemptId}`),
  
  // Grade an attempt
  gradeAttempt: (attemptId, gradeData) => 
    api.post(`/exams/attempt/${attemptId}/grade`, gradeData),
  
  // Update exam publish status
  publishExam: (examId, isPublished) => 
    api.patch(`/exams/${examId}/publish`, { isPublished }),
    
  // Get all my exam attempts (student view)
  getMyAttempts: () => 
    api.get(`/exams/my/attempts`),

  // Get all exams from enrolled courses
  getUserExams: () => 
    api.get(`/exams/user/exams`),

  // Legacy method - kept for compatibility
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
    
  // Legacy method - kept for compatibility
  submitExam: (attemptId) => 
    api.post(`/exams/attempt/${attemptId}/submit`),
    
  // Legacy method - kept for compatibility
  saveExamProgress: (attemptId, data) => 
    api.post(`/exams/attempt/${attemptId}/save`, data),
    
  // Legacy method - kept for compatibility
  updateTimeRemaining: (attemptId, timeRemaining) => {
    return api.post(`/exams/attempt/${attemptId}/save`, { timeRemaining });
  },

  // Start a new exam attempt with the current time
  startExamAttempt: (examId) => {
    const currentTime = new Date().toISOString();
    return api.post(`/exams/${examId}/attempt/start`, { 
      startTime: currentTime 
    });
  },

  // Get the status of an exam attempt
  getExamAttemptStatus: (examId) => {
    return api.get(`/exams/${examId}/attempt/status`);
  },

  // Submit completed exam attempt
  submitExamAttempt: (data) => {
    return api.post(`/exams/attempt/submit`, data);
  },

  // Submit exam attempt with file uploads
  submitExamAttemptWithFiles: (formData) => {
    return api.post(`/exams/attempt/submit-with-files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Save exam progress during attempt
  saveExamProgress: (data) => {
    return api.post(`/exams/attempt/progress`, data);
  }
};

export default examService; 