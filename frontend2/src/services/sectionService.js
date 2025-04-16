import api from './api';

/**
 * Section services for handling all section-related API interactions
 */
const sectionService = {
  // Get all sections for a course
  getSectionsByCourseId: (courseId) => 
    api.get(`/sections/courses/${courseId}/sections`),
  
  // Get a specific section by ID with its modules
  getSectionById: (sectionId) => 
    api.get(`/sections/${sectionId}`),
  
  // Create a new section
  createSection: (courseId, sectionData) => 
    api.post(`/sections/courses/${courseId}/sections`, sectionData),
  
  // Create multiple sections for a course (this will call createSection for each section)
  createSections: async (courseId, sectionsData) => {
    try {
      // Create an array of promises, each creating one section
      const createPromises = sectionsData.map(sectionData => 
        sectionService.createSection(courseId, sectionData)
      );
      
      // Wait for all sections to be created
      const results = await Promise.all(createPromises);
      
      // Return the array of created sections
      return {
        success: true,
        data: results.map(result => result.data)
      };
    } catch (error) {
      console.error('Error creating sections:', error);
      throw error;
    }
  },
  
  // Update a section
  updateSection: (sectionId, sectionData) => 
    api.put(`/sections/${sectionId}`, sectionData),
  
  // Delete a section
  deleteSection: (sectionId) => 
    api.delete(`/sections/${sectionId}`),
  
  // Update the order of sections
  updateSectionsOrder: (courseId, sectionsOrder) => 
    api.put(`/sections/courses/${courseId}/sections/order`, { sectionsOrder })
};

export default sectionService; 