const express = require('express');
const quizController = require('../Controllers/QuizController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');

const router = express.Router();

// Get quiz info (metadata only)
router.get('/module/:moduleId/info', verifyToken, quizController.getQuizInfo);

// Start a quiz
router.post('/module/:moduleId/start', verifyToken, quizController.startQuiz);

// Get quiz questions (only after starting)
router.get('/attempt/:attemptId/questions', verifyToken, quizController.getQuizQuestions);

// Save quiz progress
router.post('/attempt/:attemptId/save', verifyToken, quizController.saveQuizProgress);

// Submit quiz
router.post('/attempt/:attemptId/submit', verifyToken, quizController.submitQuiz);

// Update time remaining
router.put('/attempt/:attemptId/time', verifyToken, quizController.updateTimeRemaining);

// Get quiz attempts by module
router.get('/module/:moduleId/attempts', verifyToken, quizController.getQuizAttemptsByModule);

// Get quiz attempt by ID
router.get('/attempt/:attemptId', verifyToken, quizController.getQuizAttemptById);

module.exports = router; 