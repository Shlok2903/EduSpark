/**
 * Middleware to check if user is an admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

/**
 * Middleware to check if user is a teacher
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const isTeacher = (req, res, next) => {
  if (!req.user || !req.user.isTutor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher role required.'
    });
  }
  next();
};

/**
 * Middleware to check if user is either an admin or a teacher
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const isTeacherOrAdmin = (req, res, next) => {
  if (!req.user || (!req.user.isAdmin && !req.user.isTutor)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher or admin role required.'
    });
  }
  next();
};

/**
 * Check if the user is either an admin or the creator of the resource
 * This middleware requires the findResource parameter to be a function that
 * returns a Promise resolving to the resource with a createdBy field
 * 
 * @param {Function} findResource - Function that finds the resource (should return a Promise)
 * @returns {Function} Express middleware
 */
const isAdminOrCreator = (findResource) => {
  return async (req, res, next) => {
    try {
      // Skip check if user is admin
      if (req.user.isAdmin) {
        return next();
      }
      
      const resource = await findResource(req);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      // Check if user is the creator
      if (resource.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only manage resources you created.'
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};

module.exports = {
  isAdmin,
  isTeacher,
  isTeacherOrAdmin,
  isAdminOrCreator
}; 