const express = require('express');
const router = express.Router();
const SectionController = require('../Controllers/SectionController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');
const { isCreatorOrAdmin, isEnrolledOrCreator } = require('../Middlewares/CourseAccessMiddleware');

// Get all sections for a course - requires enrollment or creator
router.get('/courses/:courseId/sections', verifyToken, isEnrolledOrCreator, SectionController.getSectionsByCourseId);

// Get a specific section by ID - requires enrollment or creator
router.get('/sections/:sectionId', verifyToken, isEnrolledOrCreator, SectionController.getSectionById);

// Create a new section for a course - requires creator or admin
router.post('/courses/:courseId/sections', verifyToken, isCreatorOrAdmin, SectionController.createSection);

// Update a section - requires creator or admin
router.put('/sections/:sectionId', verifyToken, isCreatorOrAdmin, SectionController.updateSection);

// Delete a section - requires creator or admin
router.delete('/sections/:sectionId', verifyToken, isCreatorOrAdmin, SectionController.deleteSection);

// Update sections order - requires creator or admin
router.put('/courses/:courseId/sections/order', verifyToken, isCreatorOrAdmin, SectionController.updateSectionsOrder);

module.exports = router; 