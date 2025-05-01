const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../Controllers/DashboardController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');

// Get dashboard data
router.get('/', verifyToken, getDashboardData);

module.exports = router; 