const express = require('express');
const router = express.Router();
const SectionController = require('../Controllers/SectionController');
const verifyToken = require('../Middlewares/Auth');

// Get all sections for a course
router.get('/courses/:courseId/sections', verifyToken, SectionController.getSectionsByCourseId);

// Get a specific section by ID
router.get('/sections/:sectionId', verifyToken, SectionController.getSectionById);

// Create a new section for a course
router.post('/courses/:courseId/sections', verifyToken, SectionController.createSection);

// Update a section
router.put('/sections/:sectionId', verifyToken, SectionController.updateSection);

// Delete a section
router.delete('/sections/:sectionId', verifyToken, SectionController.deleteSection);

// Update sections order
router.put('/courses/:courseId/sections/order', verifyToken, SectionController.updateSectionsOrder);

module.exports = router; 