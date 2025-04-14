const sectionService = require('../services/sectionService');
const { handleResponse, handleError } = require('../utils/responseHandlers');

/**
 * Get all sections for a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSectionsByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const sections = await sectionService.getSectionsByCourseId(courseId);
    
    return handleResponse(res, 200, true, 'Sections retrieved successfully', sections);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Get section by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSectionById = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const section = await sectionService.getSectionById(sectionId);
    
    return handleResponse(res, 200, true, 'Section retrieved successfully', section);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Create a new section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const sectionData = req.body;
    
    const section = await sectionService.createSection(sectionData, courseId);
    
    return handleResponse(res, 201, true, 'Section created successfully', section);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Create multiple sections in batch
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSectionsBatch = async (req, res) => {
  try {
    const { sections, courseId } = req.body;
    
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return handleError(res, 400, 'No sections provided or invalid format');
    }
    
    if (!courseId) {
      return handleError(res, 400, 'Course ID is required');
    }
    
    // Check if user has permission to create sections for this course
    // This would typically be handled by a middleware, but we're adding extra validation here
    const isAllowed = await sectionService.checkCourseAccess(courseId, req.user._id);
    if (!isAllowed) {
      return handleError(res, 403, 'You do not have permission to create sections for this course');
    }
    
    const createdSections = await sectionService.createSectionsBatch(sections, courseId);
    
    return handleResponse(res, 201, true, 'Sections created successfully', createdSections);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Update a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const sectionData = req.body;
    
    const section = await sectionService.updateSection(sectionId, sectionData);
    
    return handleResponse(res, 200, true, 'Section updated successfully', section);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Delete a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    
    await sectionService.deleteSection(sectionId);
    
    return handleResponse(res, 200, true, 'Section deleted successfully');
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Update sections order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSectionsOrder = async (req, res) => {
  try {
    const { sectionsOrder } = req.body;
    
    await sectionService.updateSectionsOrder(sectionsOrder);
    
    return handleResponse(res, 200, true, 'Sections order updated successfully');
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

module.exports = {
  getSectionsByCourseId,
  getSectionById,
  createSection,
  createSectionsBatch,
  updateSection,
  deleteSection,
  updateSectionsOrder
}; 