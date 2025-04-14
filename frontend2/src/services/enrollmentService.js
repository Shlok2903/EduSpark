import api from './api';

/**
 * Enrollment services for handling all enrollment-related API interactions
 */
const enrollmentService = {
  // Enroll in a course
  enrollCourse: async (courseId) => {
    try {
      const response = await api.post('/enrollments/enroll', { courseId });
      return { success: true, ...response };
    } catch (error) {
      console.error('Enrollment error:', error);
      return { success: false, message: error.formattedMessage || 'Enrollment failed' };
    }
  },
  
  // Get enrollment status for a course
  getEnrollmentStatus: async (courseId) => {
    try {
      const response = await api.get(`/enrollments/status/${courseId}`);
      return response;
    } catch (error) {
      console.error('Error getting enrollment status:', error);
      return { isEnrolled: false };
    }
  },
  
  // Get all courses a user is enrolled in
  getUserEnrollments: async () => {
    try {
      const response = await api.get('/enrollments/user');
      return response; // Should have success and data properties
    } catch (error) {
      console.error('Error getting user enrollments:', error);
      return { success: false, data: [], message: error.formattedMessage || 'Failed to get enrollments' };
    }
  },
  
  // Mark a module as completed
  completeModule: async (courseId, moduleId) => {
    try {
      const response = await api.post('/enrollments/complete-module', { courseId, moduleId });
      return { success: true, ...response };
    } catch (error) {
      console.error('Error completing module:', error);
      return { success: false, message: error.formattedMessage || 'Failed to complete module' };
    }
  },
  
  // Get module completion status
  getModuleCompletionStatus: async (moduleId) => {
    try {
      const response = await api.get(`/enrollments/module/${moduleId}`);
      return response;
    } catch (error) {
      console.error('Error getting module completion status:', error);
      return { isCompleted: false };
    }
  },
  
  // Record module view/access
  recordModuleView: async (data) => {
    try {
      // Check if we have received an object with both courseId and moduleId
      if (typeof data === 'object' && data.courseId && data.moduleId) {
        const response = await api.post('/enrollments/track-view', {
          courseId: data.courseId,
          moduleId: data.moduleId
        });
        return { success: true, ...response };
      } 
      // Backward compatibility for just moduleId
      else if (typeof data === 'string' || typeof data === 'number') {
        console.warn('Deprecated: recordModuleView should be called with {courseId, moduleId}');
        const response = await api.post('/enrollments/track-view', { moduleId: data });
        return { success: true, ...response };
      } 
      else {
        console.error('Invalid parameters for recordModuleView');
        return { success: false, message: 'Invalid parameters' };
      }
    } catch (error) {
      console.error('Error recording module view:', error);
      return { success: false };
    }
  },
  
  // Submit quiz answers
  submitQuiz: async (moduleId, answers, score) => {
    try {
      const response = await api.post('/enrollments/submit-quiz', { moduleId, answers, score });
      return { success: true, ...response };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return { success: false, message: error.formattedMessage || 'Failed to submit quiz' };
    }
  },

  // Unenroll from a course
  unenrollCourse: async (courseId) => {
    try {
      const response = await api.delete(`/enrollments/${courseId}`);
      return { success: true, ...response };
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      return { success: false, message: error.formattedMessage || 'Failed to unenroll from course' };
    }
  }
};

export default enrollmentService; 