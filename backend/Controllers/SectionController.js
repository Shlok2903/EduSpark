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
  updateSection,
  deleteSection,
  updateSectionsOrder
}; 