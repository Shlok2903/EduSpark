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
  updateModule,
  deleteModule,
  updateModulesOrder
}; 