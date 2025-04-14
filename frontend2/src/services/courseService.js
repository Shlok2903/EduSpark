import api from './api';

/**
 * Course services for handling all course-related API interactions
 */
const courseService = {
  // Get all courses
  getAllCourses: () => api.get('/courses'),
  
  // Get courses created by a specific tutor
  getCoursesByTutor: (tutorId) => api.get(`/courses/tutor/${tutorId}`),
  
  // Get a specific course by ID
  getCourseById: (courseId) => api.get(`/courses/${courseId}`),
  
  // Create a new course (with image upload)
  createCourse: async (courseData) => {
    const formData = new FormData();
    
    // Only add the required fields: title, description (optional), isOptional, deadline, courseImage
    const requiredFields = ['title', 'description', 'isOptional', 'deadline', 'courseImage'];
    
    // Append only the required form data
    requiredFields.forEach(key => {
      if (key === 'courseImage' && courseData[key]) {
        formData.append('courseImage', courseData[key]);
      } else if (courseData[key] !== null && courseData[key] !== undefined) {
        // For boolean values, ensure they're sent as strings
        if (typeof courseData[key] === 'boolean') {
          formData.append(key, courseData[key].toString());
        } else {
          formData.append(key, courseData[key]);
        }
      }
    });
    
    try {
      return await api.post('/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Error in createCourse service:', error);
      throw error;
    }
  },
  
  // Update an existing course
  updateCourse: (courseId, courseData) => {
    const formData = new FormData();
    
    // Only add the required fields: title, description (optional), isOptional, deadline, courseImage
    const requiredFields = ['title', 'description', 'isOptional', 'deadline', 'courseImage'];
    
    // Append only the required form data
    requiredFields.forEach(key => {
      if (key === 'courseImage' && courseData[key]) {
        formData.append('courseImage', courseData[key]);
      } else if (courseData[key] !== null && courseData[key] !== undefined) {
        // For boolean values, ensure they're sent as strings
        if (typeof courseData[key] === 'boolean') {
          formData.append(key, courseData[key].toString());
        } else {
          formData.append(key, courseData[key]);
        }
      }
    });
    
    return api.put(`/courses/${courseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Delete a course
  deleteCourse: (courseId) => api.delete(`/courses/${courseId}`),
};

export default courseService; 