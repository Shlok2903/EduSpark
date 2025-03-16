const express = require('express');
const router = express.Router();
const { handleUpload } = require('../Middlewares/uploadMiddleware');
const ensureAuthenticated = require('../Middlewares/Auth');
const { isAdminOrTutor, isAdminOrCreator } = require('../Middlewares/roleMiddleware');
const Course = require('../Models/Course');
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} = require('../Controllers/CourseController');

// Apply auth middleware to all routes
router.use(ensureAuthenticated);

// Get all courses - accessible to all authenticated users
router.get('/', getAllCourses);

// Get a specific course by ID - accessible to all authenticated users
router.get('/:courseId', getCourseById);

// Create a new course with image upload - requires admin or tutor role
router.post('/', isAdminOrTutor, handleUpload('courseImage'), createCourse);

// Update a course with optional image upload - requires admin or course creator
router.put(
  '/:courseId', 
  isAdminOrCreator((req) => Course.findById(req.params.courseId)), 
  handleUpload('courseImage'), 
  updateCourse
);

// Delete a course - requires admin or course creator
router.delete(
  '/:courseId', 
  isAdminOrCreator((req) => Course.findById(req.params.courseId)), 
  deleteCourse
);

module.exports = router; 