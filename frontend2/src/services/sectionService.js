import api from './api';

/**
 * Section services for handling all section-related API interactions
 */
const sectionService = {
  // Get all sections for a course
  getSectionsByCourseId: async (courseId) => {
    try {
      const response = await api.get(`/sections/courses/${courseId}/sections`);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If response is already in { success, data } format, return it directly
        if (response.hasOwnProperty('success') && response.hasOwnProperty('data')) {
          return response;
        }
        
        // If it's an array, wrap it in success/data format
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
      return {
        success: false,
        message: 'Invalid response format from API',
        data: []
      };
    } catch (error) {
      console.error('Error fetching sections for course:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch sections',
        data: []
      };
    }
  },
  
  // Get a specific section by ID with its modules
  getSectionById: async (sectionId) => {
    try {
      const response = await api.get(`/sections/${sectionId}`);
      
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
      console.error('Error fetching section:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to fetch section',
        data: null
      };
    }
  },
  
  // Create a new section
  createSection: async (courseId, sectionData) => {
    try {
      const response = await api.post(`/sections/courses/${courseId}/sections`, sectionData);
      
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
      console.error('Error creating section:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to create section',
        data: null
      };
    }
  },
  
  // Create multiple sections for a course (this will call createSection for each section)
  createSections: async (courseId, sectionsData) => {
    try {
      // Create an array of promises, each creating one section
      const createPromises = sectionsData.map(sectionData => 
        sectionService.createSection(courseId, sectionData)
      );
      
      // Wait for all sections to be created
      const results = await Promise.all(createPromises);
      
      // Check if any creation failed
      const failedResults = results.filter(result => !result.success);
      
      if (failedResults.length > 0) {
        return {
          success: false,
          message: 'Failed to create some sections',
          data: results
        };
      }
      
      // Return the array of created sections
      return {
        success: true,
        data: results.map(result => result.data)
      };
    } catch (error) {
      console.error('Error creating sections:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to create sections',
        data: []
      };
    }
  },
  
  // Update a section
  updateSection: async (sectionId, sectionData) => {
    try {
      const response = await api.put(`/sections/${sectionId}`, sectionData);
      
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
      console.error('Error updating section:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to update section',
        data: null
      };
    }
  },
  
  // Delete a section
  deleteSection: async (sectionId) => {
    try {
      const response = await api.delete(`/sections/${sectionId}`);
      
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
      console.error('Error deleting section:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to delete section'
      };
    }
  },
  
  // Update the order of sections
  updateSectionsOrder: async (courseId, sectionsOrder) => {
    try {
      const response = await api.put(`/sections/courses/${courseId}/sections/order`, { sectionsOrder });
      
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
      console.error('Error updating sections order:', error);
      return {
        success: false,
        message: error.formattedMessage || 'Failed to update sections order',
        data: null
      };
    }
  }
};

export default sectionService; 