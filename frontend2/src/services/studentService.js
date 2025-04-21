import api from './api';

/**
 * Service for managing students
 */
const studentService = {
  /**
   * Add a new student
   * @param {Object} studentData - Student information (name, email, semester, semesterId, branch, branchId, parentName, parentEmail) 
   * @returns {Promise} - API response
   */
  addStudent: async (studentData) => {
    try {
      console.log('Student service sending data:', JSON.stringify(studentData));
      const response = await api.post('/students', studentData);
      console.log('Student service received response:', response);
      return response;
    } catch (error) {
      console.error('Error adding student:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error details:', error.message);
      
      // Format error message for display
      let formattedMessage = 'Failed to add student. Please try again.';
      if (error.response?.data?.message) {
        formattedMessage = error.response.data.message;
      }
      
      // Add the formatted message to the error object
      error.formattedMessage = formattedMessage;
      throw error;
    }
  },

  /**
   * Get all students with optional filtering
   * @param {Object} filters - Optional filters (semester, branch)
   * @returns {Promise} - API response with students array
   */
  getStudents: async (filters = {}) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.branch) params.append('branch', filters.branch);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.search) params.append('search', filters.search);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/students/all${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  /**
   * Get available filter options (semesters, branches)
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
  },

  // Get student dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get('/students/dashboard');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};

export default studentService; 