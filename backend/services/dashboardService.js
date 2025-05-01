const Course = require('../Models/Course');
const User = require('../Models/User');
const Enrollment = require('../Models/Enrollment');
const Module = require('../Models/Module');
const mongoose = require('mongoose');
const QuizAttempt = require('../Models/QuizAttempt');
const Exam = require('../Models/Exam');
const ExamAttempt = require('../Models/ExamAttempt');

/**
 * Get student dashboard data
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Dashboard data
 */
const getStudentDashboard = async (userId) => {
  try {
    // Get enrolled courses count
    const enrolledCourses = await Enrollment.find({ userId });
    const activeCourses = enrolledCourses.length;

    // Get course progress
    const courseProgress = await Promise.all(enrolledCourses.map(async (enrollment) => {
      const course = await Course.findById(enrollment.courseId);
      if (!course) return null;

      // Calculate progress
      const totalModules = await Module.countDocuments({ courseId: course._id });
      const completedModules = enrollment.completedModules?.length || 0;
      const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

      return {
        courseId: course._id,
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        progress: Math.round(progress),
        lastAccessed: enrollment.lastAccessed
      };
    }));

    // Filter out null values and sort by last accessed
    const validCourseProgress = courseProgress
      .filter(course => course !== null)
      .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));

    // Get pending exams and quizzes
    const courseIds = enrolledCourses.map(enrollment => enrollment.courseId);
    
    // Count pending exams
    const pendingExams = await Exam.countDocuments({
      courseId: { $in: courseIds },
      endDate: { $gte: new Date() }
    });

    // Get attempted exam IDs
    const attemptedExamIds = await ExamAttempt.distinct('examId', { userId });

    // Count unfinished exams
    const unfinishedExams = await Exam.countDocuments({
      courseId: { $in: courseIds },
      _id: { $nin: attemptedExamIds },
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    // Get attempted quiz IDs
    const attemptedQuizIds = await QuizAttempt.distinct('quizId', { userId });

    // Count unfinished quizzes
    const unfinishedQuizzes = await Module.countDocuments({
      courseId: { $in: courseIds },
      'quiz._id': { $exists: true },
      'quiz._id': { $nin: attemptedQuizIds }
    });

    return {
      activeCourses,
      pendingExams: unfinishedExams + unfinishedQuizzes,
      achievements: {
        totalBadges: 0, // To be implemented with achievements feature
        recentBadges: []
      },
      courseProgress: validCourseProgress
    };
  } catch (error) {
    throw new Error(`Error fetching student dashboard: ${error.message}`);
  }
};

/**
 * Get teacher dashboard data
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Dashboard data
 */
const getTeacherDashboard = async (userId) => {
  try {
    // Get courses created by teacher
    const courses = await Course.find({ createdBy: userId });
    
    // Get total students enrolled in teacher's courses
    const enrollments = await Enrollment.aggregate([
      {
        $match: {
          courseId: { $in: courses.map(course => course._id) }
        }
      },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 }
        }
      }
    ]);

    return {
      activeCourses: courses.length,
      totalStudents: enrollments[0]?.totalStudents || 0,
      pendingReviews: 0, // To be implemented with assignments feature
      recentActivity: [] // To be implemented with activity tracking
    };
  } catch (error) {
    throw new Error(`Error fetching teacher dashboard: ${error.message}`);
  }
};

/**
 * Get admin dashboard data
 * @returns {Promise<Object>} Dashboard data
 */
const getAdminDashboard = async () => {
  try {
    // Get platform statistics
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      recentUsers,
      platformStats: {
        activeUsers: totalUsers, // To be refined with active user tracking
        courseCompletionRate: 0 // To be implemented with course completion tracking
      }
    };
  } catch (error) {
    throw new Error(`Error fetching admin dashboard: ${error.message}`);
  }
};

module.exports = {
  getStudentDashboard,
  getTeacherDashboard,
  getAdminDashboard
}; 