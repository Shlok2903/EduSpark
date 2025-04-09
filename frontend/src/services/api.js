import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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
      // Log token for debugging
      console.log('Using token:', token.substring(0, 10) + '...');
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No token found in localStorage');
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
        console.log('Token expired, redirecting to login');
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

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  tutorSignup: (userData) => api.post('/auth/tutorsignup', userData)
};

// User services
export const userService = {
  getUserProfile: () => api.get('/users/profile'),
  updateUserProfile: (userData) => api.put('/users/profile', userData)
};

// Course services
export const courseService = {
  // Get all courses
  getAllCourses: () => api.get('/courses'),
  
  // Get a specific course by ID
  getCourseById: (courseId) => api.get(`/courses/${courseId}`),
  
  // Create a new course (with image upload)
  createCourse: (courseData) => {
    const formData = new FormData();
    
    // Append all the form data
    Object.keys(courseData).forEach(key => {
      if (key === 'courseImage' && courseData[key]) {
        formData.append('courseImage', courseData[key]);
      } else if (courseData[key] !== null && courseData[key] !== undefined) {
        formData.append(key, courseData[key]);
      }
    });
    
    return api.post('/courses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).catch(error => {
      console.error('Course creation error:', error);
      throw error;
    });
  },
  
  // Update an existing course
  updateCourse: (courseId, courseData) => {
    const formData = new FormData();
    
    // Append all the form data
    Object.keys(courseData).forEach(key => {
      if (key === 'courseImage' && courseData[key]) {
        formData.append('courseImage', courseData[key]);
      } else if (courseData[key] !== null && courseData[key] !== undefined) {
        formData.append(key, courseData[key]);
      }
    });
    
    return api.put(`/courses/${courseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).catch(error => {
      console.error('Course update error:', error);
      throw error;
    });
  },
  
  // Delete a course
  deleteCourse: (courseId) => api.delete(`/courses/${courseId}`).catch(error => {
    console.error('Course deletion error:', error);
    throw error;
  }),
  
  // Enroll in a course
  enrollInCourse: (courseId) => {
    return enrollmentService.enrollCourse(courseId);
  }
};

// Section services
export const sectionService = {
  // Get all sections for a course
  getSectionsByCourseId: (courseId) => api.get(`/courses/${courseId}/sections`),
  
  // Get a specific section by ID
  getSectionById: (sectionId) => api.get(`/sections/${sectionId}`),
  
  // Create a new section
  createSection: (courseId, sectionData) => {
    return api.post(`/courses/${courseId}/sections`, sectionData)
      .catch(error => {
        console.error('Section creation error:', error);
        throw error;
      });
  },
  
  // Update a section
  updateSection: (sectionId, sectionData) => {
    return api.put(`/sections/${sectionId}`, sectionData)
      .catch(error => {
        console.error('Section update error:', error);
        throw error;
      });
  },
  
  // Delete a section
  deleteSection: (sectionId) => api.delete(`/sections/${sectionId}`)
    .catch(error => {
      console.error('Section deletion error:', error);
      throw error;
    }),
  
  // Update sections order
  updateSectionsOrder: (courseId, sectionsOrder) => 
    api.put(`/courses/${courseId}/sections/order`, { sectionsOrder })
      .catch(error => {
        console.error('Sections order update error:', error);
        throw error;
      })
};

// Module services
export const moduleService = {
  // Get all modules for a section
  getModulesBySectionId: (sectionId) => api.get(`/sections/${sectionId}/modules`),
  
  // Get a specific module by ID
  getModuleById: (moduleId) => api.get(`/modules/${moduleId}`),
  
  // Create a new module
  createModule: (courseId, sectionId, moduleData) => {
    const contentType = moduleData.contentType;
    let requestData;
    
    // If this is a quiz, ensure questions are properly formatted
    if (contentType === 'quizz' && moduleData.quizQuestions) {
      requestData = {
        ...moduleData,
        quizQuestions: Array.isArray(moduleData.quizQuestions) 
          ? moduleData.quizQuestions 
          : JSON.parse(moduleData.quizQuestions)
      };
    } else {
      requestData = moduleData;
    }
    
    return api.post(`/courses/${courseId}/sections/${sectionId}/modules`, requestData)
      .catch(error => {
        console.error('Module creation error:', error);
        throw error;
      });
  },
  
  // Update a module
  updateModule: (moduleId, moduleData) => {
    const contentType = moduleData.contentType;
    let requestData;
    
    // If this is a quiz, ensure questions are properly formatted
    if (contentType === 'quizz' && moduleData.quizQuestions) {
      requestData = {
        ...moduleData,
        quizQuestions: Array.isArray(moduleData.quizQuestions) 
          ? moduleData.quizQuestions 
          : JSON.parse(moduleData.quizQuestions)
      };
    } else {
      requestData = moduleData;
    }
    
    return api.put(`/modules/${moduleId}`, requestData)
      .catch(error => {
        console.error('Module update error:', error);
        throw error;
      });
  },
  
  // Delete a module
  deleteModule: (moduleId) => api.delete(`/modules/${moduleId}`)
    .catch(error => {
      console.error('Module deletion error:', error);
      throw error;
    }),
  
  // Update modules order
  updateModulesOrder: (sectionId, modulesOrder) => 
    api.put(`/sections/${sectionId}/modules/order`, { modulesOrder })
      .catch(error => {
        console.error('Modules order update error:', error);
        throw error;
      })
};

// Enrollment services
export const enrollmentService = {
  // Enroll in a course
  enrollCourse: (courseId) => api.post('/enrollments/enroll', { courseId }),
  
  // Get enrollment status for a course
  getEnrollmentStatus: (courseId) => api.get(`/enrollments/status/${courseId}`),
  
  // Get all courses a user is enrolled in
  getUserEnrollments: () => api.get('/enrollments/user'),
  
  // Mark a module as completed
  completeModule: (courseId, moduleId) => api.post('/enrollments/complete-module', { 
    courseId, 
    moduleId 
  }),
  
  // Get module completion status
  getModuleCompletionStatus: (moduleId) => api.get(`/enrollments/module/${moduleId}`),
  
  // Get all enrolled users for a course (for course creators)
  getCourseEnrollments: (courseId) => api.get(`/enrollments/course/${courseId}`),
  
  // Unenroll from a course
  unenrollCourse: (courseId) => api.delete(`/enrollments/${courseId}`),
  
  // Track module view and automatically mark as complete
  trackModuleView: (courseId, moduleId) => api.post('/enrollments/track-view', { 
    courseId, 
    moduleId 
  })
};

// Exam API services
export const examService = {
  getCourseExams: async (courseId) => {
    try {
      return await api.get(`/exams/course/${courseId}`);
    } catch (error) {
      console.error('Error fetching course exams:', error);
      throw error;
    }
  },
  
  getExamById: async (examId) => {
    try {
      return await api.get(`/exams/${examId}`);
    } catch (error) {
      console.error('Error fetching exam details:', error);
      throw error;
    }
  },
  
  createExam: async (examData) => {
    try {
      return await api.post('/exams/create', examData);
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  },
  
  updateExam: async (examId, examData) => {
    try {
      return await api.put(`/exams/${examId}`, examData);
    } catch (error) {
      console.error('Error updating exam:', error);
      throw error;
    }
  },
  
  deleteExam: async (examId) => {
    try {
      return await api.delete(`/exams/${examId}`);
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw error;
    }
  },
  
  startExam: async (examId) => {
    try {
      return await api.post(`/exams/${examId}/start`);
    } catch (error) {
      console.error('Error starting exam:', error);
      throw error;
    }
  },
  
  saveExamProgress: async (attemptId, data) => {
    try {
      return await api.post(`/exams/attempt/${attemptId}/save`, data);
    } catch (error) {
      console.error('Error saving exam progress:', error);
      throw error;
    }
  },
  
  submitExam: async (attemptId) => {
    try {
      return await api.post(`/exams/attempt/${attemptId}/submit`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      throw error;
    }
  },
  
  uploadFile: async (attemptId, sectionId, questionId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      return await api.post(
        `/exams/attempt/${attemptId}/upload/${sectionId}/${questionId}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
  
  uploadExamFile: async (attemptId, questionId, formData) => {
    try {
      return await api.post(
        `/exams/attempt/${attemptId}/upload/section/${questionId}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
  
  saveAnswer: async (attemptId, answerData) => {
    try {
      return await api.post(`/exams/attempt/${attemptId}/save-answer`, answerData);
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  },
  
  updateTimeRemaining: async (attemptId, timeRemaining) => {
    try {
      return await api.put(`/exams/attempt/${attemptId}/time`, { timeRemaining });
    } catch (error) {
      console.error('Error updating time remaining:', error);
      throw error;
    }
  },
  
  getExamAttempts: async (examId) => {
    try {
      return await api.get(`/exams/${examId}/attempts`);
    } catch (error) {
      console.error('Error fetching exam attempts:', error);
      throw error;
    }
  },
  
  getAttemptById: async (attemptId) => {
    try {
      return await api.get(`/exams/attempt/${attemptId}`);
    } catch (error) {
      console.error('Error fetching attempt details:', error);
      throw error;
    }
  },
  
  getExamAttempt: async (attemptId) => {
    try {
      return await api.get(`/exams/attempt/${attemptId}`);
    } catch (error) {
      console.error('Error fetching attempt details:', error);
      throw error;
    }
  },
  
  gradeAttempt: async (attemptId, grades) => {
    try {
      return await api.post(`/exams/attempt/${attemptId}/grade`, grades);
    } catch (error) {
      console.error('Error grading attempt:', error);
      throw error;
    }
  },
  
  gradeExam: async (attemptId, data) => {
    try {
      return await api.post(`/exams/attempt/${attemptId}/grade`, data);
    } catch (error) {
      console.error('Error grading exam:', error);
      throw error;
    }
  },
  
  getMyAttempts: async () => {
    try {
      return await api.get('/exams/my/attempts');
    } catch (error) {
      console.error('Error fetching my attempts:', error);
      throw error;
    }
  },
  
  deleteAttempt: async (attemptId) => {
    try {
      return await api.delete(`/exams/attempt/${attemptId}`);
    } catch (error) {
      console.error('Error deleting attempt:', error);
      throw error;
    }
  },
  
  downloadResults: async (examId) => {
    try {
      const response = await api.get(`/exams/${examId}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error downloading results:', error);
      throw error;
    }
  },
  
  sendResultEmails: async (examId, data) => {
    try {
      return await api.post(`/exams/${examId}/send-emails`, data);
    } catch (error) {
      console.error('Error sending result emails:', error);
      throw error;
    }
  }
};

// Export the base API for custom calls
export default api;

export {
  api
}; 