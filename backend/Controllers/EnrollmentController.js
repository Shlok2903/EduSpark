// Import models directly
const Enrollment = require('../Models/Enrollment');
const Course = require('../Models/Course');
const Section = require('../Models/Section');
const Module = require('../Models/Module');
const mongoose = require('mongoose');

// Enroll a user in a course
exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      courseId,
      userId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    // If course is not public, check if the student's branch and semester match
    if (course.visibilityType !== 'public' && req.user.isStudent) {
      const userBranch = req.user.branch;
      const userSemester = req.user.semester;
      
      // For mandatory/optional courses, check if branch and semester match
      if (course.visibilityType === 'mandatory' || course.visibilityType === 'optional') {
        if (!course.branch.equals(userBranch) || !course.semester.equals(userSemester)) {
          return res.status(403).json({ 
            message: 'You cannot enroll in this course as it is not for your branch/semester' 
          });
        }
      }
      
      // For courses assigned to specific branch/semester combinations
      if (course.assignments && course.assignments.length > 0) {
        const isAssignedToUser = course.assignments.some(assignment => 
          assignment.branchId.equals(userBranch) && assignment.semesterId.equals(userSemester)
        );
        
        if (!isAssignedToUser) {
          return res.status(403).json({ 
            message: 'This course is not assigned to your branch/semester' 
          });
        }
      }
    }

    // Get all sections and modules to build the initial progress structure
    const sections = await Section.find({ courseId }).sort({ order: 1 });
    
    const sectionProgress = [];
    
    for (const section of sections) {
      const modules = await Module.find({ 
        sectionId: section._id,
        courseId
      }).sort({ order: 1 });
      
      const moduleProgress = modules.map(module => ({
        moduleId: module._id,
        isCompleted: false
      }));
      
      sectionProgress.push({
        sectionId: section._id,
        moduleProgress,
        isCompleted: false
      });
    }

    // Create new enrollment
    const newEnrollment = new Enrollment({
      courseId,
      userId,
      sectionProgress
    });

    await newEnrollment.save();
    
    return res.status(201).json({
      message: 'Successfully enrolled in the course',
      enrollment: newEnrollment
    });
  } catch (error) {
    console.error('Error in enrollCourse:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a module as completed
exports.completeModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.body;
    const userId = req.user.id;

    // Find the enrollment
    const enrollment = await Enrollment.findOne({
      courseId,
      userId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Find the module to ensure it exists
    const module = await Module.findOne({
      _id: moduleId,
      courseId
    });

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Find and update the module progress in the enrollment
    let moduleFound = false;
    let totalModules = 0;
    let completedModules = 0;

    for (const section of enrollment.sectionProgress) {
      totalModules += section.moduleProgress.length;
      
      for (const moduleProgress of section.moduleProgress) {
        if (moduleProgress.isCompleted) {
          completedModules++;
        }
        
        if (moduleProgress.moduleId.toString() === moduleId) {
          // Skip if already completed
          if (moduleProgress.isCompleted) {
            return res.status(200).json({ 
              message: 'Module already completed',
              progress: enrollment.progress
            });
          }
          
          moduleProgress.isCompleted = true;
          moduleProgress.completedAt = new Date();
          moduleFound = true;
          completedModules++;
        }
      }
      
      // Check if all modules in the section are completed
      const allModulesCompleted = section.moduleProgress.every(mp => mp.isCompleted);
      if (allModulesCompleted && !section.isCompleted) {
        section.isCompleted = true;
        section.completedAt = new Date();
      }
    }

    if (!moduleFound) {
      return res.status(404).json({ message: 'Module not found in the enrollment' });
    }

    // Update overall progress percentage
    enrollment.progress = Math.round((completedModules / totalModules) * 100);
    enrollment.lastAccessedAt = new Date();

    await enrollment.save();

    return res.status(200).json({
      message: 'Module marked as completed',
      progress: enrollment.progress
    });
  } catch (error) {
    console.error('Error in completeModule:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get enrollment status and progress for a user in a course
exports.getEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      courseId,
      userId
    });

    if (!enrollment) {
      return res.status(200).json({ 
        success: true,
        isEnrolled: false,
        message: 'User is not enrolled in this course'
      });
    }

    return res.status(200).json({
      success: true,
      isEnrolled: enrollment.isEnrolled,
      enrollmentDate: enrollment.enrollmentDate,
      progress: enrollment.progress,
      lastAccessedAt: enrollment.lastAccessedAt,
      sectionProgress: enrollment.sectionProgress
    });
  } catch (error) {
    console.error('Error in getEnrollmentStatus:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message
    });
  }
};

// Get all enrollments for a user
exports.getUserEnrollments = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await Enrollment.find({
      userId,
      isEnrolled: true
    }).populate({
      path: 'courseId',
      select: 'title description imageUrl createdBy'
    });

    return res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Error in getUserEnrollments:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all users enrolled in a course (for course creators)
exports.getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Verify the user is the course creator
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course creator or an admin
    if (course.createdBy.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view enrollments for this course' });
    }

    const enrollments = await Enrollment.find({
      courseId,
      isEnrolled: true
    }).populate({
      path: 'userId',
      select: 'name email'
    });

    return res.status(200).json(enrollments);
  } catch (error) {
    console.error('Error in getCourseEnrollments:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unenroll from a course
exports.unenrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      courseId,
      userId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    enrollment.isEnrolled = false;
    await enrollment.save();

    return res.status(200).json({ message: 'Successfully unenrolled from the course' });
  } catch (error) {
    console.error('Error in unenrollCourse:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get module completion status
exports.getModuleCompletionStatus = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id || req.user._id;

    // Find enrollment that contains this module
    const enrollment = await Enrollment.findOne({
      userId,
      isEnrolled: true,
      "sectionProgress.moduleProgress.moduleId": moduleId
    });

    if (!enrollment) {
      return res.status(200).json({
        isCompleted: false,
        message: 'Module not found or user is not enrolled'
      });
    }

    // Find the module in the enrollment data
    let isCompleted = false;
    let completedAt = null;

    for (const section of enrollment.sectionProgress) {
      for (const module of section.moduleProgress) {
        if (module.moduleId.toString() === moduleId) {
          isCompleted = module.isCompleted;
          completedAt = module.completedAt;
          break;
        }
      }
      if (isCompleted) break;
    }

    return res.status(200).json({
      isCompleted,
      completedAt
    });
  } catch (error) {
    console.error('Error in getModuleCompletionStatus:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Track module view and automatically mark as complete
exports.trackModuleView = async (req, res) => {
  try {
    const { courseId, moduleId } = req.body;
    const userId = req.user.id;

    // Validate required parameters
    if (!courseId || !moduleId) {
      return res.status(400).json({ 
        success: false,
        message: 'Both courseId and moduleId are required' 
      });
    }

    // Find the enrollment
    const enrollment = await Enrollment.findOne({
      courseId,
      userId
    });

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Enrollment not found' 
      });
    }

    // Find the module to ensure it exists
    const module = await Module.findOne({
      _id: moduleId,
      courseId
    });

    if (!module) {
      return res.status(404).json({ 
        success: false,
        message: 'Module not found' 
      });
    }

    // Find and update the module progress in the enrollment
    let moduleFound = false;
    let totalModules = 0;
    let completedModules = 0;

    for (const section of enrollment.sectionProgress) {
      totalModules += section.moduleProgress.length;
      
      for (const moduleProgress of section.moduleProgress) {
        if (moduleProgress.isCompleted) {
          completedModules++;
        }
        
        if (moduleProgress.moduleId.toString() === moduleId) {
          // Mark as viewed but don't automatically complete
          // This just records the view time
          moduleFound = true;
          enrollment.lastAccessedAt = new Date();
        }
      }
    }

    if (!moduleFound) {
      return res.status(404).json({ 
        success: false,
        message: 'Module not found in the enrollment' 
      });
    }

    // Update the last access time
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: 'Module view recorded',
      progress: enrollment.progress
    });
  } catch (error) {
    console.error('Error in trackModuleView:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
}; 