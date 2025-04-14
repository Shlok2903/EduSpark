const express = require('express');
const router = express.Router();
const practiceController = require('../Controllers/PracticeController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Generate practice questions
router.post('/generate', practiceController.generatePracticeQuestions);

// Get practice by ID
router.get('/:practiceId', practiceController.getPracticeById);

// Get all practices for user
router.get('/', practiceController.getUserPractices);

// Submit practice answers
router.post('/:practiceId/submit', practiceController.submitPracticeAnswers);

module.exports = router; 