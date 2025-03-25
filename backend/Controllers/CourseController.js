const courseService = require('../services/courseService');

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

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
}; 