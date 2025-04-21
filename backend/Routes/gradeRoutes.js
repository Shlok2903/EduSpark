const express = require('express');
const router = express.Router();
const gradeController = require('../Controllers/GradeController');
const auth = require('../Middlewares/auth');

// Create a new grade from exam attempt
router.post('/create-from-exam', auth, gradeController.createGradeFromExamAttempt);

// Get all grades (admin/teacher only)
router.get('/', auth, gradeController.getAllGrades);

// Get grades by user ID
router.get('/user/:userId', auth, gradeController.getGradesByUser);

// Get grade by ID
router.get('/:gradeId', auth, gradeController.getGradeById);

// Update grade
router.put('/:gradeId', auth, gradeController.updateGrade);

module.exports = router; 