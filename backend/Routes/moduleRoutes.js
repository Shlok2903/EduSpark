const express = require('express');
const router = express.Router();
const ModuleController = require('../Controllers/ModuleController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');
const { isCreatorOrAdmin, isEnrolledOrCreator } = require('../Middlewares/CourseAccessMiddleware');

// Get all modules for a section - requires enrollment or creator
router.get('/sections/:sectionId/modules', verifyToken, isEnrolledOrCreator, ModuleController.getModulesBySectionId);

// Get a specific module by ID - requires enrollment or creator
router.get('/modules/:moduleId', verifyToken, isEnrolledOrCreator, ModuleController.getModuleById);

// Create a new module for a section - requires creator or admin
router.post('/courses/:courseId/sections/:sectionId/modules', verifyToken, isCreatorOrAdmin, ModuleController.createModule);

// Update a module - requires creator or admin
router.put('/modules/:moduleId', verifyToken, isCreatorOrAdmin, ModuleController.updateModule);

// Delete a module - requires creator or admin
router.delete('/modules/:moduleId', verifyToken, isCreatorOrAdmin, ModuleController.deleteModule);

// Update modules order - requires creator or admin
router.put('/sections/:sectionId/modules/order', verifyToken, isCreatorOrAdmin, ModuleController.updateModulesOrder);

module.exports = router; 