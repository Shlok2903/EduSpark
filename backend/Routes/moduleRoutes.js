const express = require('express');
const router = express.Router();
const ModuleController = require('../Controllers/ModuleController');
const verifyToken = require('../Middlewares/Auth');

// Get all modules for a section
router.get('/sections/:sectionId/modules', verifyToken, ModuleController.getModulesBySectionId);

// Get a specific module by ID
router.get('/modules/:moduleId', verifyToken, ModuleController.getModuleById);

// Create a new module for a section
router.post('/courses/:courseId/sections/:sectionId/modules', verifyToken, ModuleController.createModule);

// Update a module
router.put('/modules/:moduleId', verifyToken, ModuleController.updateModule);

// Delete a module
router.delete('/modules/:moduleId', verifyToken, ModuleController.deleteModule);

// Update modules order
router.put('/sections/:sectionId/modules/order', verifyToken, ModuleController.updateModulesOrder);

module.exports = router; 