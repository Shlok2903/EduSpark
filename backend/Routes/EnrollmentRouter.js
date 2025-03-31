const express = require('express');
const router = express.Router();
const enrollmentController = require('../Controllers/EnrollmentController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');

// Enroll in a course
router.post('/enroll', verifyToken, enrollmentController.enrollCourse);

// Mark a module as completed
router.post('/complete-module', verifyToken, enrollmentController.completeModule);

// Get enrollment status for a specific course
router.get('/status/:courseId', verifyToken, enrollmentController.getEnrollmentStatus);

// Get all courses that a user is enrolled in
router.get('/user', verifyToken, enrollmentController.getUserEnrollments);

// Get all users enrolled in a course (only for course creator)
router.get('/course/:courseId', verifyToken, enrollmentController.getCourseEnrollments);

// Unenroll from a course
router.delete('/:courseId', verifyToken, enrollmentController.unenrollCourse);

// Get module completion status
router.get('/module/:moduleId', verifyToken, enrollmentController.getModuleCompletionStatus);

// Add new route for tracking module views
router.post('/track-view', verifyToken, enrollmentController.trackModuleView);

module.exports = router; 