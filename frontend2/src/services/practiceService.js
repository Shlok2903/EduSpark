import api from './api';

/**
 * Practice services for AI-generated quiz practice
 */
const practiceService = {
  // Get all enrolled courses for dropdown
  getEnrolledCourses: () => 
    api.get('/courses/enrolled'),
  
  // Generate practice questions
  generatePractice: (data) => 
    api.post('/practice/generate', data),
  
  // Get a specific practice by ID
  getPracticeById: (practiceId) =>
    api.get(`/practice/${practiceId}`),
  
  // Start a practice quiz (initializes timer)
  startPractice: (practiceId) => 
    api.post(`/practice/${practiceId}/start`),
  
  // Update time remaining
  updateTimeRemaining: (practiceId, timeRemaining) => 
    api.put(`/practice/${practiceId}/time`, { timeRemaining }),
  
  // Submit practice attempt
  submitPracticeAttempt: (practiceId, answers) => 
    api.post(`/practice/${practiceId}/submit`, { answers }),
  
  // Get practice attempts history
  getPracticeHistory: () => 
    api.get('/practice').then(response => {
      // Make sure we're returning the actual data
      return response.data || [];
    })
};

export default practiceService; 