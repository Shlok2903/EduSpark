const Course = require('../Models/Course');
const Section = require('../Models/Section');
const Module = require('../Models/Module');
const { uploadToCloudinary } = require('../config/cloudinary');
const mongoose = require('mongoose');

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
 * @returns {Promise<Object>} Course with sections and modules
 */
const getCourseById = async (courseId) => {
  try {
    const course = await Course.findById(courseId)
      .populate('createdBy', 'name email');
    
    if (!course) {
      throw new Error('Course not found');
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
      sections: sectionsWithModules
    };
  } catch (error) {
    throw new Error(`Error fetching course: ${error.message}`);
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
    
    // Check if user is authorized to edit this course
    // Allow if: user is an admin, or user is the creator
    if (!isAdmin && course.createdBy.toString() !== userId) {
      throw new Error('You do not have permission to update this course. Only admins or the course creator can edit courses.');
    }
    
    // Upload image to cloudinary if provided
    let imageUrl = course.imageUrl;
    if (imageBuffer) {
      const result = await uploadToCloudinary(imageBuffer);
      imageUrl = result.secure_url;
    }
    
    // Update fields
    if (courseData.title) course.title = courseData.title;
    if (courseData.description) course.description = courseData.description;
    if (courseData.isOptional !== undefined) {
      course.isOptional = courseData.isOptional === 'true';
    }
    if (courseData.deadline !== undefined) {
      course.deadline = courseData.deadline ? new Date(courseData.deadline) : null;
    }
    if (imageUrl) course.imageUrl = imageUrl;
    
    await course.save();
    return course;
  } catch (error) {
    throw new Error(`Error updating course: ${error.message}`);
  }
};

/**
 * Delete a course and all its related data
 * @param {string} courseId - Course ID
 * @param {string} userId - User ID of deleter
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<boolean>} Success flag
 */
const deleteCourse = async (courseId, userId, isAdmin) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const course = await Course.findById(courseId).session(session);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if user is authorized to delete this course
    if (!isAdmin && course.createdBy.toString() !== userId) {
      throw new Error('You do not have permission to delete this course. Only admins or the course creator can delete courses.');
    }
    
    // Delete all sections and their modules
    const sections = await Section.find({ courseId }).session(session);
    for (const section of sections) {
      await Module.deleteMany({ sectionId: section._id }).session(session);
    }
    
    await Section.deleteMany({ courseId }).session(session);
    
    // Delete the course
    await Course.findByIdAndDelete(courseId).session(session);
    
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Error deleting course: ${error.message}`);
  } finally {
    session.endSession();
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
}; 