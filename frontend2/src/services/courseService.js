import api from './api';

/**
 * Course services for handling all course-related API interactions
 */
const courseService = {
  // Get all courses
  getAllCourses: async () => {
    try {
      console.log('Fetching all courses...');
      const response = await api.get('/courses');
      console.log('Courses API response:', response);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's just an array, wrap it in success/data format
        if (Array.isArray(response)) {
          return {
            success: true,
            data: response
          };
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      console.error('Unexpected courses response format:', response);
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching all courses:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch courses',
        data: []
      };
    }
  },
  
  // Get courses created by a specific tutor
  getCoursesByTutor: async (tutorId) => {
    try {
      const response = await api.get(`/courses/tutor/${tutorId}`);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching tutor courses:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch tutor courses',
        data: []
      };
    }
  },
  
  // Get courses created by the current user (teacher)
  getTeacherCourses: async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return {
          success: false,
          message: 'User ID not available',
          data: []
        };
      }
      
      return await courseService.getCoursesByTutor(userId);
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch your courses',
        data: []
      };
    }
  },
  
  // Get a specific course by ID
  getCourseById: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API',
        data: null
      };
    } catch (error) {
      console.error('Error fetching course:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch course',
        data: null
      };
    }
  },
  
  // Get courses for student based on branch and semester
  getCoursesForStudent: async (branchId, semesterId) => {
    try {
      const response = await api.get(`/courses/student/${branchId}/${semesterId}`);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API',
        data: null
      };
    } catch (error) {
      console.error('Error fetching student courses:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch courses for student',
        data: null
      };
    }
  },
  
  // Create a new course
  createCourse: async (courseData) => {
    try {
      const formData = new FormData();
      
      // Append text fields to form data
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      formData.append('visibilityType', courseData.visibilityType);
      
      // Add branch and semester for non-public courses
      if (courseData.visibilityType === 'mandatory' || courseData.visibilityType === 'optional') {
        formData.append('branch', courseData.branch);
        formData.append('semester', courseData.semester);
      }
      
      if (courseData.deadline) {
        formData.append('deadline', courseData.deadline);
      }
      
      // Append image if available
      if (courseData.courseImage) {
        formData.append('courseImage', courseData.courseImage);
      }
      
      const response = await api.post('/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Course creation API response:', response);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's just the data object, wrap it in success/data format
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      console.error('Unexpected course creation response format:', response);
      return {
        success: false,
        message: 'Invalid response format from API',
        data: null
      };
    } catch (error) {
      console.error('Error creating course:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to create course',
        data: null
      };
    }
  },
  
  // Update a course
  updateCourse: async (courseId, courseData) => {
    try {
      const formData = new FormData();
      
      // Append text fields to form data
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      formData.append('visibilityType', courseData.visibilityType);
      
      // Add branch and semester for non-public courses
      if (courseData.visibilityType === 'mandatory' || courseData.visibilityType === 'optional') {
        if (courseData.branch) formData.append('branch', courseData.branch);
        if (courseData.semester) formData.append('semester', courseData.semester);
      }
      
      if (courseData.deadline) {
        formData.append('deadline', courseData.deadline);
      }
      
      // Append image if available
      if (courseData.image) {
        formData.append('courseImage', courseData.image);
      }
      
      const response = await api.put(`/courses/${courseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Course update API response:', response);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's just the data object, wrap it in success/data format
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API',
        data: null
      };
    } catch (error) {
      console.error('Error updating course:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to update course',
        data: null
      };
    }
  },
  
  // Delete a course
  deleteCourse: async (courseId) => {
    try {
      const response = await api.delete(`/courses/${courseId}`);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success')) {
          return response;
        }
        
        // If it's just the data object, wrap it in success/data format
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API'
      };
    } catch (error) {
      console.error('Error deleting course:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to delete course'
      };
    }
  },
  
  // Get courses created by a tutor
  getTutorCourses: async (tutorId) => {
    try {
      const response = await api.get(`/courses/tutor/${tutorId}`);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching tutor courses:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch tutor courses',
        data: []
      };
    }
  },
  
  // Get courses the user is enrolled in
  getEnrolledCourses: async () => {
    try {
      const response = await api.get('/courses/enrolled');
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch enrolled courses',
        data: []
      };
    }
  },
  
  // Assign a course to a branch and semester
  assignCourse: async (courseId, branchId, semesterId) => {
    try {
      const response = await api.post('/courses/assign', {
        courseId,
        branchId,
        semesterId
      });
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success')) {
          return response;
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API'
      };
    } catch (error) {
      console.error('Error assigning course:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to assign course'
      };
    }
  },
  
  // Unassign a course from a branch and semester
  unassignCourse: async (courseId, branchId, semesterId) => {
    try {
      const response = await api.post('/courses/unassign', {
        courseId,
        branchId,
        semesterId
      });
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success')) {
          return response;
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API'
      };
    } catch (error) {
      console.error('Error unassigning course:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to unassign course'
      };
    }
  },
  
  // Get courses assigned to a branch and semester
  getAssignedCourses: async (branchId, semesterId) => {
    try {
      const response = await api.get(`/courses/assigned/${branchId}/${semesterId}`);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's an object but not in the expected format, wrap it
        return {
          success: true,
          data: response
        };
      }
      
      // Fallback for unexpected response formats
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch assigned courses',
        data: []
      };
    }
  }
};

export default courseService; 