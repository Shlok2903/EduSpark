const express = require('express');
const router = express.Router();
const practiceController = require('../Controllers/PracticeController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Generate practice questions
router.post('/generate', practiceController.generatePracticeQuestions);

// Get a specific practice by ID
router.get('/:practiceId', practiceController.getPracticeById);

// Start practice quiz (sets the start time)
router.post('/:practiceId/start', practiceController.startPractice);

// Update time remaining
router.put('/:practiceId/time', practiceController.updateTimeRemaining);

// Get all practices for user
router.get('/', practiceController.getUserPractices);

// Submit practice answers
router.post('/:practiceId/submit', practiceController.submitPracticeAnswers);

module.exports = router; 