import api from './api';

/**
 * Service for managing students
 */
const studentService = {
  /**
   * Add a new student
   * @param {Object} studentData - Student information (name, email, semester, degree, parentName, parentEmail) 
   * @returns {Promise} - API response
   */
  addStudent: async (studentData) => {
    try {
      const response = await api.post('/students', studentData);
      return response;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  /**
   * Get all students with optional filtering
   * @param {Object} filters - Optional filters (semester, degree)
   * @returns {Promise} - API response with students array
   */
  getStudents: async (filters = {}) => {
    try {
      const params = {};
      if (filters.semester) params.semester = filters.semester;
      if (filters.degree) params.degree = filters.degree;

      const response = await api.get('/students', { params });
      return response;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  /**
   * Get available filter options (semesters, degrees)
   * @returns {Promise} - API response with filters object
   */
  getFilterOptions: async () => {
    try {
      const response = await api.get('/students/filters');
      return response;
    } catch (error) {
      console.error('Error fetching student filters:', error);
      throw error;
    }
  }
};

export default studentService; 