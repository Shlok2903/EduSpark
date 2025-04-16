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
    api.get(`/practice/${practiceId}`)
      .then(response => {
        // Sometimes the response is already processed by the axios interceptor
        if (response && (response.questions || response._id)) {
          return response;
        }
        // Sometimes we need to extract from data
        return response.data || null;
      })
      .catch(error => {
        console.error("Error fetching practice by ID:", error);
        throw error;
      }),
  
  // Start a practice quiz (initializes timer)
  startPractice: (practiceId) => 
    api.post(`/practice/${practiceId}/start`)
      .then(response => {
        // Check for expired practice
        if (response.timeExpired) {
          console.log("Practice has expired:", response.message);
        }
        return response.data || response;
      })
      .catch(error => {
        console.error("Error starting practice:", error);
        if (error.response?.status === 400 && error.response?.data?.timeExpired) {
          // Handle expired practice
          return { 
            timeExpired: true, 
            message: error.response.data.message || "Practice time has expired" 
          };
        }
        throw error;
      }),
  
  // Submit practice attempt
  submitPracticeAttempt: (practiceId, answers) => 
    api.post(`/practice/${practiceId}/submit`, { answers })
      .then(response => {
        return response.data || response;
      }),
  
  // Get practice attempts history
  getPracticeHistory: () => 
    api.get('/practice')
      .then(response => {
        // Make sure we're returning the actual data
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
      .catch(error => {
        console.error("Error fetching practice history:", error);
        return [];
      })
};

export default practiceService; 