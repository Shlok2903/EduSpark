import api from './api';

/**
 * Services for handling semester-related API interactions
 */
const semesterService = {
  // Get all semesters
  getAllSemesters: async () => {
    try {
      const response = await api.get('/semesters');
      
      // Check if response has success property
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
      console.error('Unexpected response format from semesters API:', response);
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching semesters:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch semesters',
        data: []
      };
    }
  },
  
  // Get semesters by branch ID
  getSemestersByBranch: async (branchId) => {
    try {
      const response = await api.get(`/semesters/by-branch/${branchId}`);
      
      // Check if response has success property
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
      console.error('Unexpected response format from semesters by branch API:', response);
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching semesters by branch:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch semesters for this branch',
        data: []
      };
    }
  },
  
  // Get a specific semester by ID
  getSemesterById: async (semesterId) => {
    try {
      const response = await api.get(`/semesters/${semesterId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a new semester
  createSemester: async (semesterData) => {
    try {
      const response = await api.post('/semesters', semesterData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update a semester
  updateSemester: async (semesterId, semesterData) => {
    try {
      const response = await api.put(`/semesters/${semesterId}`, semesterData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a semester
  deleteSemester: async (semesterId) => {
    try {
      const response = await api.delete(`/semesters/${semesterId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default semesterService;
