const { Course, Enrollment } = require('../Models');

/**
 * Middleware to check if user is the course creator
 * Only allows course creators or admins to proceed
 */
exports.isCreatorOrAdmin = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Handle both possible ID formats
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.isAdmin;

    console.log('User ID in middleware:', userId); // Debug
    console.log('User object:', req.user); // Debug

    // If user is admin, allow access
    if (isAdmin) {
      return next();
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Course creator ID:', course.createdBy.toString()); // Debug

    // Check if user is the creator
    if (course.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. Only the course creator can perform this action' 
      });
    }

    // Set course for other middleware/controllers to use
    req.course = course;
    next();
  } catch (error) {
    console.error('Error in isCreatorOrAdmin middleware:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Middleware to check if user is enrolled in the course or is the creator
 * Allows course creators, admins, or enrolled users to proceed
 */
exports.isEnrolledOrCreator = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Handle both possible ID formats
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.isAdmin;

    console.log('User ID in enrollment middleware:', userId); // Debug

    // If user is admin, allow access
    if (isAdmin) {
      return next();
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the creator
    if (course.createdBy.toString() === userId.toString()) {
      req.isCreator = true;
      req.course = course;
      return next();
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      courseId,
      userId,
      isEnrolled: true
    });

    if (!enrollment) {
      return res.status(403).json({ 
        message: 'Access denied. You need to enroll in this course to access it',
        requiresEnrollment: true
      });
    }

    req.isCreator = false;
    req.isEnrolled = true;
    req.enrollment = enrollment;
    req.course = course;
    next();
  } catch (error) {
    console.error('Error in isEnrolledOrCreator middleware:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 