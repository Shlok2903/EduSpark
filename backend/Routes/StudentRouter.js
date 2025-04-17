const router = require('express').Router();
const { addStudent, getStudents, getStudentFilters } = require('../Controllers/StudentController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');
const { isTeacherOrAdmin } = require('../Middlewares/RoleMiddleware');

// All routes require authentication and admin/teacher role
router.use(verifyToken, isTeacherOrAdmin);

// Student management routes
router.post('/', addStudent);
router.get('/', getStudents);
router.get('/filters', getStudentFilters);

module.exports = router; 