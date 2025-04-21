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
    
    // Use helper to get consistent userId
    const userIdStr = getUserIdString(userId);
    
    // Get user from DB using the normalized ID
    const user = await User.findById(userIdStr);
    
    // Course creator check
    const courseCreatorId = getUserIdString(course.createdBy);
    
    const isCreator = courseCreatorId === userIdStr;
    const isAdmin = user?.isAdmin === true;
    const isTutor = user?.isTutor === true;
    
    // Check enrollment status
    let isEnrolled = false;
    let enrollmentData = null;
    
    // Check if user is enrolled in this course
    const enrollment = await Enrollment.findOne({
      courseId: course._id,
      userId: userIdStr
    });
    
    // If enrollment record exists and is active
    if (enrollment && enrollment.isEnrolled) {
      isEnrolled = true;
      enrollmentData = enrollment;
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
    
    // Return course with all necessary data
    return {
      ...course.toObject(),
      sections: sectionsWithModules,
      isCreator,
      isEnrolled,
      enrollment: enrollmentData,
      isAdmin,
      isTutor
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
    const { title, description, visibilityType, deadline, branch, semester } = courseData;
    
    // Upload image to cloudinary if provided
    let imageUrl = '';
    if (imageBuffer) {
      const result = await uploadToCloudinary(imageBuffer);
      imageUrl = result.secure_url;
    }

    // Generate a unique course_id
    const course_id = 'CRS_' + new mongoose.Types.ObjectId().toString();

    // Create course object with basic fields
    const courseObj = {
      course_id,
      title,
      description,
      visibilityType: visibilityType || 'public', // Default to public if not specified
      deadline: deadline ? new Date(deadline) : null,
      imageUrl,
      createdBy: userId,
      assignments: [] // Initialize with empty assignments
    };

    // Add branch and semester if course is mandatory or optional
    if (visibilityType === 'mandatory' || visibilityType === 'optional') {
      if (branch) courseObj.branch = branch;
      if (semester) courseObj.semester = semester;
    }

    const course = new Course(courseObj);
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
 * @param {boolean} isTutor - Whether the user is a tutor
 * @returns {Promise<Object>} Deletion result
 */
const deleteCourse = async (courseId, userId, isAdmin, isTutor) => {
  try {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if user is creator, admin, or tutor
    if (course.createdBy.toString() !== userId.toString() && !isAdmin && !isTutor) {
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

/**
 * Get courses created by a specific user (tutor)
 * @param {string} userId - The user/tutor ID
 * @returns {Promise<Array>} Courses created by the user
 */
const getCoursesByCreator = async (userId) => {
  try {
    const userIdStr = getUserIdString(userId);
    return await Course.find({ createdBy: userIdStr })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching courses by creator: ${error.message}`);
  }
};

/**
 * Get all courses a user is enrolled in
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} List of enrolled courses with enrollment data
 */
const getEnrolledCourses = async (userId) => {
  try {
    const userIdStr = getUserIdString(userId);
    
    // Find all enrollments for this user
    const enrollments = await Enrollment.find({
      userId: userIdStr,
      isEnrolled: true
    });
    
    // Get the course IDs from enrollments
    const courseIds = enrollments.map(e => e.courseId);
    
    // If no enrollments, return empty array
    if (courseIds.length === 0) {
      return [];
    }
    
    // Fetch courses by IDs
    const courses = await Course.find({
      _id: { $in: courseIds }
    }).populate('createdBy', 'name email');
    
    // Merge enrollment data with course data
    const coursesWithEnrollment = courses.map(course => {
      const enrollment = enrollments.find(e => 
        e.courseId.toString() === course._id.toString()
      );
      
      return {
        ...course.toObject(),
        enrollmentDate: enrollment.createdAt,
        progress: enrollment.progress,
        isEnrolled: true
      };
    });
    
    return coursesWithEnrollment;
  } catch (error) {
    throw new Error(`Error fetching enrolled courses: ${error.message}`);
  }
};

/**
 * Assign a course to a specific branch and semester
 * @param {string} courseId - Course ID
 * @param {string} branchId - Branch ID
 * @param {string} semesterId - Semester ID
 * @param {string} userId - User ID of assigner (must be admin or creator)
 * @returns {Promise<Object>} Updated course
 */
const assignCourse = async (courseId, branchId, semesterId, userId) => {
  try {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if user is creator or admin
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (course.createdBy.toString() !== userId && !user.isAdmin && !user.isTutor) {
      throw new Error('Not authorized to assign this course');
    }
    
    // Check if branch and semester exist
    const branch = await mongoose.model('branches').findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    const semester = await mongoose.model('semesters').findById(semesterId);
    if (!semester) {
      throw new Error('Semester not found');
    }
    
    // Check if semester belongs to the branch
    if (semester.branchId.toString() !== branchId) {
      throw new Error('Semester does not belong to the selected branch');
    }
    
    // Check if assignment already exists
    const existingAssignment = course.assignments.find(
      assignment => 
        assignment.branchId.toString() === branchId && 
        assignment.semesterId.toString() === semesterId
    );
    
    if (existingAssignment) {
      throw new Error('Course is already assigned to this branch and semester');
    }
    
    // Add the new assignment
    course.assignments.push({
      branchId,
      semesterId,
      assignedAt: new Date()
    });
    
    await course.save();
    
    return course;
  } catch (error) {
    throw new Error(`Error assigning course: ${error.message}`);
  }
};

/**
 * Unassign a course from a specific branch and semester
 * @param {string} courseId - Course ID
 * @param {string} branchId - Branch ID
 * @param {string} semesterId - Semester ID
 * @param {string} userId - User ID of assigner (must be admin or creator)
 * @returns {Promise<Object>} Updated course
 */
const unassignCourse = async (courseId, branchId, semesterId, userId) => {
  try {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if user is creator or admin
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (course.createdBy.toString() !== userId && !user.isAdmin && !user.isTutor) {
      throw new Error('Not authorized to unassign this course');
    }
    
    // Filter out the assignment
    course.assignments = course.assignments.filter(
      assignment => 
        !(assignment.branchId.toString() === branchId && 
          assignment.semesterId.toString() === semesterId)
    );
    
    await course.save();
    
    return course;
  } catch (error) {
    throw new Error(`Error unassigning course: ${error.message}`);
  }
};

/**
 * Get courses assigned to a specific branch and semester
 * @param {string} branchId - Branch ID
 * @param {string} semesterId - Semester ID
 * @returns {Promise<Array>} Courses assigned to the branch and semester
 */
const getAssignedCourses = async (branchId, semesterId) => {
  try {
    const courses = await Course.find({
      'assignments': { 
        $elemMatch: { 
          branchId: new mongoose.Types.ObjectId(branchId),
          semesterId: new mongoose.Types.ObjectId(semesterId)
        }
      }
    }).populate('createdBy', 'name email');
    
    return courses;
  } catch (error) {
    throw new Error(`Error fetching assigned courses: ${error.message}`);
  }
};

/**
 * Get courses for a student based on their branch and semester
 * This includes public courses and assigned courses (both mandatory and optional)
 * @param {string} userId - User ID of the student
 * @param {string} branchId - Student's branch ID
 * @param {string} semesterId - Student's semester ID
 * @returns {Promise<Array>} Combined array of relevant courses for the student
 */
const getCoursesForStudent = async (userId, branchId, semesterId) => {
  try {
    // Get all public courses
    const publicCourses = await Course.find({ visibilityType: 'public' })
      .populate('createdBy', 'name email');
    
    // Get courses specifically for the student's branch and semester
    const branchSemesterCourses = await Course.find({
      $or: [
        // Directly assigned branch and semester in the course
        {
          visibilityType: { $in: ['mandatory', 'optional'] },
          branch: new mongoose.Types.ObjectId(branchId),
          semester: new mongoose.Types.ObjectId(semesterId)
        },
        // Assigned via the assignments array
        {
      'assignments': { 
        $elemMatch: { 
              branchId: new mongoose.Types.ObjectId(branchId),
              semesterId: new mongoose.Types.ObjectId(semesterId)
        }
      }
        }
      ]
    }).populate('createdBy', 'name email');
    
    // Get the student's enrollments to determine enrollment status
    const enrollments = await Enrollment.find({ userId });
    const enrolledCourseIds = enrollments.map(e => e.courseId.toString());
    
    // Combine public and branch/semester courses, removing duplicates
    const allCourseMap = new Map();
    
    // Add public courses to the map
    publicCourses.forEach(course => {
      allCourseMap.set(course._id.toString(), {
      ...course.toObject(),
      isEnrolled: enrolledCourseIds.includes(course._id.toString())
      });
    });
    
    // Add branch/semester courses to the map (will overwrite duplicates)
    branchSemesterCourses.forEach(course => {
      allCourseMap.set(course._id.toString(), {
      ...course.toObject(),
      isEnrolled: enrolledCourseIds.includes(course._id.toString())
      });
    });
    
    // Convert map values to array
    return Array.from(allCourseMap.values());
  } catch (error) {
    throw new Error(`Error fetching courses for student: ${error.message}`);
  }
};

/**
 * Get all public courses
 * @returns {Promise<Array>} Public courses
 */
const getPublicCourses = async () => {
  try {
    return await Course.find({ visibilityType: 'public' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching public courses: ${error.message}`);
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
  getUserIdString,
  getCoursesByCreator,
  getEnrolledCourses,
  assignCourse,
  unassignCourse,
  getAssignedCourses,
  getCoursesForStudent,
  getPublicCourses
}; 