const dashboardService = require('../services/dashboardService');
const { handleResponse, handleError } = require('../utils/responseHandlers');

/**
 * Get dashboard data based on user role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isAdmin, isTutor } = req.user;
    let dashboardData;

    if (isAdmin) {
      dashboardData = await dashboardService.getAdminDashboard();
    } else if (isTutor) {
      dashboardData = await dashboardService.getTeacherDashboard(userId);
    } else {
      dashboardData = await dashboardService.getStudentDashboard(userId);
    }

    return handleResponse(res, 200, true, 'Dashboard data retrieved successfully', dashboardData);
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};

module.exports = {
  getDashboardData
}; 