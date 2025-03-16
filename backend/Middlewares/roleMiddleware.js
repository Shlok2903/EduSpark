/**
 * Check if the user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
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
 * Check if the user is a tutor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isTutor = (req, res, next) => {
  if (!req.user || !req.user.isTutor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Tutor role required.'
    });
  }
  next();
};

/**
 * Check if the user is either an admin or a tutor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdminOrTutor = (req, res, next) => {
  if (!req.user || (!req.user.isAdmin && !req.user.isTutor)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or tutor role required.'
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
  isTutor,
  isAdminOrTutor,
  isAdminOrCreator
}; 