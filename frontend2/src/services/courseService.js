import api from './api';

/**
 * Course services for handling all course-related API interactions
 */
const courseService = {
  // Get all courses
  getAllCourses: async () => {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get courses created by a specific tutor
  getCoursesByTutor: (tutorId) => api.get(`/courses/tutor/${tutorId}`),
  
  // Get a specific course by ID
  getCourseById: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a new course
  createCourse: async (courseData) => {
    try {
      const formData = new FormData();
      
      // Append text fields to form data
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      formData.append('visibilityType', courseData.visibilityType); // Updated field name
      
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
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update a course
  updateCourse: async (courseId, courseData) => {
    try {
      const formData = new FormData();
      
      // Append text fields to form data
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      formData.append('visibilityType', courseData.visibilityType); // Updated field name
      
      if (courseData.deadline) {
        formData.append('deadline', courseData.deadline);
      }
      
      // Append image if available
      if (courseData.courseImage) {
        formData.append('courseImage', courseData.courseImage);
      }
      
      const response = await api.put(`/courses/${courseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a course
  deleteCourse: async (courseId) => {
    try {
      const response = await api.delete(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get courses created by a tutor
  getTutorCourses: async (tutorId) => {
    try {
      const response = await api.get(`/courses/tutor/${tutorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get courses the user is enrolled in
  getEnrolledCourses: async () => {
    try {
      const response = await api.get('/courses/enrolled');
      return response.data;
    } catch (error) {
      throw error;
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
      return response.data;
    } catch (error) {
      throw error;
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
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get courses assigned to a branch and semester
  getAssignedCourses: async (branchId, semesterId) => {
    try {
      const response = await api.get(`/courses/assigned/${branchId}/${semesterId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get courses for a student based on their branch and semester
  getCoursesForStudent: async (branchId, semesterId) => {
    try {
      const response = await api.get(`/courses/student/${branchId}/${semesterId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default courseService; 