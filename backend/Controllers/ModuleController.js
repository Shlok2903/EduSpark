const moduleService = require('../services/moduleService');
const { handleResponse, handleError } = require('../utils/responseHandlers');

/**
 * Get all modules for a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getModulesBySectionId = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const modules = await moduleService.getModulesBySectionId(sectionId);
    
    return handleResponse(res, 200, true, 'Modules retrieved successfully', modules);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Get module by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getModuleById = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await moduleService.getModuleById(moduleId);
    
    return handleResponse(res, 200, true, 'Module retrieved successfully', module);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Create a new module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createModule = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const moduleData = req.body;
    
    const module = await moduleService.createModule(courseId, sectionId, moduleData);
    
    return handleResponse(res, 201, true, 'Module created successfully', module);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Create multiple modules in batch
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createModulesBatch = async (req, res) => {
  try {
    const { modules, courseId, sectionId } = req.body;
    
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return handleError(res, 400, 'No modules provided or invalid format');
    }
    
    if (!courseId || !sectionId) {
      return handleError(res, 400, 'Course ID and Section ID are required');
    }
    
    // Check if user has permission to create modules for this course/section
    const isAllowed = await moduleService.checkAccess(courseId, sectionId, req.user._id);
    if (!isAllowed) {
      return handleError(res, 403, 'You do not have permission to create modules for this section');
    }
    
    const createdModules = await moduleService.createModulesBatch(modules, courseId, sectionId);
    
    return handleResponse(res, 201, true, 'Modules created successfully', createdModules);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Update a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const moduleData = req.body;
    
    const module = await moduleService.updateModule(moduleId, moduleData);
    
    return handleResponse(res, 200, true, 'Module updated successfully', module);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Delete a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    await moduleService.deleteModule(moduleId);
    
    return handleResponse(res, 200, true, 'Module deleted successfully');
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

/**
 * Update modules order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateModulesOrder = async (req, res) => {
  try {
    const { modulesOrder } = req.body;
    
    await moduleService.updateModulesOrder(modulesOrder);
    
    return handleResponse(res, 200, true, 'Modules order updated successfully');
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

module.exports = {
  getModulesBySectionId,
  getModuleById,
  createModule,
  createModulesBatch,
  updateModule,
  deleteModule,
  updateModulesOrder
}; 