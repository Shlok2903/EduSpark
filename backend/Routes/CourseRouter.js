const express = require('express');
const router = express.Router();
const { handleUpload } = require('../Middlewares/uploadMiddleware');
const { verifyToken } = require('../Middlewares/AuthMiddleware');
const { isTeacherOrAdmin } = require('../Middlewares/RoleMiddleware');
const { isCreatorOrAdmin, isEnrolledOrCreator } = require('../Middlewares/CourseAccessMiddleware');
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getTutorCourses,
  getEnrolledCourses
} = require('../Controllers/CourseController');

// Apply auth middleware to all routes
router.use(verifyToken);

// Get all courses - accessible to all authenticated users
router.get('/', getAllCourses);

// Get courses created by a tutor - verifies if user is a tutor first
router.get('/tutor/:tutorId', getTutorCourses);

// Get all courses the user is enrolled in
router.get('/enrolled', getEnrolledCourses);

// Get a specific course by ID - checks for creator or enrollment status
router.get('/:courseId', getCourseById);

// Create a new course with image upload - requires admin or tutor role
router.post('/', isTeacherOrAdmin, handleUpload('courseImage'), createCourse);

// Update a course with optional image upload - requires admin or course creator
router.put(
  '/:courseId', 
  isCreatorOrAdmin, 
  handleUpload('courseImage'), 
  updateCourse
);

// Delete a course - requires admin or course creator
router.delete(
  '/:courseId', 
  isCreatorOrAdmin, 
  deleteCourse
);

module.exports = router; 