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
      config.headers['Authorization'] = token;
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
  
  // Enroll in a course (placeholder for future implementation)
  enrollInCourse: (courseId) => {
    // This would be implemented when you build the enrollment feature
    console.log(`Enrolling in course ${courseId}`);
    return Promise.resolve({ success: true, message: 'Enrolled successfully' });
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

// Export the base API for custom calls
export default api; 