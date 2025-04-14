const courseService = require('../services/courseService');
const User = require('../Models/User');

// Create a new course with image upload to cloudinary
const createCourse = async (req, res) => {
  try {
    const courseData = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;
    const userId = req.user._id;
    
    const course = await courseService.createCourse(courseData, imageBuffer, userId);
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// Get a single course with its sections and modules
const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    
    try {
      const course = await courseService.getCourseById(courseId, userId);
      
      res.status(200).json({
        success: true,
        data: course
      });
    } catch (error) {
      // If error is about enrollment, return 403 instead of 500
      if (error.message.includes('need to enroll')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          requiresEnrollment: true
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
};

// Update a course
const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseData = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;
    const userId = req.user._id;
    const isAdmin = req.user.isAdmin;
    const isTutor = req.user.isTutor;
    
    const course = await courseService.updateCourse(courseId, courseData, imageBuffer, userId, isAdmin, isTutor);
    
    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (error.message.includes('You do not have permission')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.isAdmin;
    
    await courseService.deleteCourse(courseId, userId, isAdmin);
    
    res.status(200).json({
      success: true,
      message: 'Course and all related content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    
    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (error.message === 'You do not have permission to delete this course') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this course'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

// Get courses created by a tutor
const getTutorCourses = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const requestingUserId = req.user._id;
    
    // Check if the requesting user is the same as the tutor or is an admin
    if (tutorId !== requestingUserId.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these courses'
      });
    }
    
    // Verify if the user is a tutor
    const user = await User.findById(tutorId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.isTutor) {
      return res.status(403).json({
        success: false,
        message: 'User is not a tutor'
      });
    }
    
    // Get courses created by the tutor
    const courses = await courseService.getCoursesByCreator(tutorId);
    
    res.status(200).json({
      success: true,
      isTutor: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching tutor courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tutor courses',
      error: error.message
    });
  }
};

// Get courses the user is enrolled in
const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all courses the user is enrolled in
    const courses = await courseService.getEnrolledCourses(userId);
    
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
};

// Export all controller functions
module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getTutorCourses,
  getEnrolledCourses
}; 