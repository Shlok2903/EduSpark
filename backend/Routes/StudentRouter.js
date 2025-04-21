const express = require('express');
const router = express.Router();
const { addStudent, getStudents, getStudentFilters, getStudentDashboard } = require('../Controllers/StudentController');
const { verifyToken, isTeacher, isAdmin } = require('../Middlewares/AuthMiddleware');
const { isTeacherOrAdmin } = require('../Middlewares/RoleMiddleware');

// Base authentication middleware for all routes
router.use(verifyToken);

// Student management routes (require teacher/admin role)
router.post('/add', isTeacherOrAdmin, addStudent);
router.get('/all', isTeacherOrAdmin, getStudents);
router.get('/filters', isTeacherOrAdmin, getStudentFilters);

// Student dashboard data (accessible to all authenticated users, including students)
router.get('/dashboard', getStudentDashboard);

module.exports = router; 