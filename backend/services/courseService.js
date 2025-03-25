const Course = require('../Models/Course');
const Section = require('../Models/Section');
const Module = require('../Models/Module');
const Enrollment = require('../Models/Enrollment');
const { uploadToCloudinary } = require('../config/cloudinary');
const mongoose = require('mongoose');
const User = require('../Models/User');

/**
 * Helper function to get a consistent user ID string regardless of input format
 * @param {string|object} userId - User ID in any format
 * @returns {string|null} - User ID as string or null
 */
const getUserIdString = (userId) => {
  if (!userId) return null;
  
  // Handle object with _id property (like req.user)
  if (typeof userId === 'object') {
    if (userId._id) return userId._id.toString();
    // Handle Mongoose ObjectId
    if (userId.toString) return userId.toString();
    return null;
  }
  
  // Handle string ID
  return userId.toString();
};

/**
 * Get all courses
 * @returns {Promise<Array>} All courses
 */
const getAllCourses = async () => {
  try {
    return await Course.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching courses: ${error.message}`);
  }
};

/**
 * Get a single course by ID with its sections and modules
 * @param {string} courseId - The course ID
 * @param {string} userId - The user ID requesting access
 * @returns {Promise<Object>} Course with sections and modules
 */
const getCourseById = async (courseId, userId) => {
  try {
    const course = await Course.findById(courseId)
      .populate('createdBy', 'name email');
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Get user from database to check roles
    console.log('User ID received:', userId);
    console.log('Type of userId:', typeof userId);
    
    // Use helper to get consistent userId
    const userIdStr = getUserIdString(userId);
    console.log('Normalized userId:', userIdStr);
    
    // Get user from DB using the normalized ID
    const user = await User.findById(userIdStr);
    console.log('User found:', user ? `ID: ${user._id}, Name: ${user.name}` : 'None');
    
    // Course creator check
    const courseCreatorId = getUserIdString(course.createdBy);
    
    const isCreator = courseCreatorId === userIdStr;
    const isAdmin = user?.isAdmin === true;
    
    // Log all details for debugging
    console.log('Course access detailed check:', { 
      isCreator, 
      isAdmin, 
      courseCreator: courseCreatorId,
      userId: userIdStr,
      originalUserId: userId
    });
    
    let isEnrolled = false;
    
    // Skip enrollment check for creators and admins
    if (!isCreator && !isAdmin) {
      const enrollment = await Enrollment.findOne({
        courseId: course._id,
        userId: userIdStr,
        isEnrolled: true
      });
      
      isEnrolled = !!enrollment;
      
      // If user is not the creator/admin and not enrolled, throw error
      if (!isEnrolled) {
        throw new Error('You need to enroll in this course to view it');
      }
    } else {
      // Automatically consider creators and admins as "enrolled" for UI purposes
      isEnrolled = true;
    }
    
    // Get sections for this course
    const sections = await Section.find({ courseId }).sort({ order: 1, createdAt: 1 });
    
    // Get modules for each section
    const sectionsWithModules = await Promise.all(sections.map(async (section) => {
      const modules = await Module.find({ sectionId: section._id }).sort({ order: 1, createdAt: 1 });
      return {
        ...section.toObject(),
        modules
      };
    }));
    
    return {
      ...course.toObject(),
      sections: sectionsWithModules,
      isCreator,
      isEnrolled
    };
  } catch (error) {
    throw new Error(`Error fetching course: ${error.message}`);
  }
};

/**
 * Check if a user is enrolled in a course
 * @param {string} courseId - The course ID
 * @param {string} userId - The user ID 
 * @returns {Promise<boolean>} True if enrolled, false otherwise
 */
const checkEnrollment = async (courseId, userId) => {
  try {
    const enrollment = await Enrollment.findOne({
      courseId,
      userId,
      isEnrolled: true
    });
    
    return !!enrollment;
  } catch (error) {
    throw new Error(`Error checking enrollment: ${error.message}`);
  }
};

/**
 * Check if a user is the creator of a course
 * @param {string} courseId - The course ID
 * @param {string} userId - The user ID 
 * @returns {Promise<boolean>} True if creator, false otherwise
 */
const isCreator = async (courseId, userId) => {
  try {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Use helper for consistent user ID handling
    const userIdStr = getUserIdString(userId);
    const courseCreatorId = getUserIdString(course.createdBy);
    
    console.log('Creator check detailed:', { 
      courseCreatorId, 
      userIdStr, 
      match: courseCreatorId === userIdStr,
      originalUserId: userId
    });
    
    return courseCreatorId === userIdStr;
  } catch (error) {
    console.error('Error checking creator status:', error);
    throw new Error(`Error checking creator status: ${error.message}`);
  }
};

/**
 * Create a new course
 * @param {Object} courseData - Course data
 * @param {Buffer} imageBuffer - Image buffer if available
 * @param {string} userId - User ID of creator
 * @returns {Promise<Object>} Created course
 */
const createCourse = async (courseData, imageBuffer, userId) => {
  try {
    const { title, description, isOptional, deadline } = courseData;
    
    // Upload image to cloudinary if provided
    let imageUrl = '';
    if (imageBuffer) {
      const result = await uploadToCloudinary(imageBuffer);
      imageUrl = result.secure_url;
    }

    // Generate a unique course_id
    const course_id = 'CRS_' + new mongoose.Types.ObjectId().toString();

    const course = new Course({
      course_id,
      title,
      description,
      isOptional: isOptional === 'true',
      deadline: deadline ? new Date(deadline) : null,
      imageUrl,
      createdBy: userId
    });

    await course.save();
    return course;
  } catch (error) {
    // Check for duplicate key error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.course_id) {
      throw new Error('A course with this ID already exists. Please try again.');
    }
    throw new Error(`Error creating course: ${error.message}`);
  }
};

/**
 * Update an existing course
 * @param {string} courseId - Course ID
 * @param {Object} courseData - Updated course data
 * @param {Buffer} imageBuffer - Image buffer if available
 * @param {string} userId - User ID of editor
 * @param {boolean} isAdmin - Whether the user is an admin
 * @param {boolean} isTutor - Whether the user is a tutor
 * @returns {Promise<Object>} Updated course
 */
const updateCourse = async (courseId, courseData, imageBuffer, userId, isAdmin, isTutor) => {
  try {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if user is creator or admin
    if (course.createdBy.toString() !== userId && !isAdmin) {
      throw new Error('Not authorized to update this course');
    }
    
    // Handle image upload if provided
    if (imageBuffer) {
      const uploadResult = await uploadToCloudinary(imageBuffer);
      courseData.imageUrl = uploadResult.secure_url;
    }
    
    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: courseData },
      { new: true }
    ).populate('createdBy', 'name email');
    
    return updatedCourse;
  } catch (error) {
    throw new Error(`Error updating course: ${error.message}`);
  }
};

/**
 * Delete a course
 * @param {string} courseId - Course ID to delete
 * @param {string} userId - User ID deleting the course
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Object>} Deletion result
 */
const deleteCourse = async (courseId, userId, isAdmin) => {
  try {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if user is creator or admin
    if (course.createdBy.toString() !== userId && !isAdmin) {
      throw new Error('Not authorized to delete this course');
    }
    
    // Delete sections and modules
    const sections = await Section.find({ courseId });
    for (const section of sections) {
      await Module.deleteMany({ sectionId: section._id });
    }
    
    await Section.deleteMany({ courseId });
    
    // Delete enrollments for this course
    await Enrollment.deleteMany({ courseId });
    
    // Delete the course
    await Course.findByIdAndDelete(courseId);
    
    return { success: true, message: 'Course and all related data deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting course: ${error.message}`);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  checkEnrollment,
  isCreator,
  getUserIdString
}; 