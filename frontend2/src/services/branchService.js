import api from './api';

/**
 * Services for handling branch-related API interactions
 */
const branchService = {
  // Get all branches
  getAllBranches: async () => {
    try {
      const response = await api.get('/branches');
      
      // Check if response has success property (common API response format)
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
      console.error('Unexpected response format from branches API:', response);
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching branches:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch branches',
        data: []
      };
    }
  },
  
  // Get branches with semesters
  getBranchesWithSemesters: async () => {
    try {
      const response = await api.get('/branches/with-semesters');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get a specific branch by ID
  getBranchById: async (branchId) => {
    try {
      const response = await api.get(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get a branch with its semesters
  getBranchWithSemesters: async (branchId) => {
    try {
      const response = await api.get(`/branches/${branchId}/with-semesters`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a new branch
  createBranch: async (branchData) => {
    try {
      const response = await api.post('/branches', branchData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update a branch
  updateBranch: async (branchId, branchData) => {
    try {
      const response = await api.put(`/branches/${branchId}`, branchData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a branch
  deleteBranch: async (branchId) => {
    try {
      const response = await api.delete(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default branchService; 