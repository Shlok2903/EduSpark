const UserModel = require('../Models/User');
const bcrypt = require('bcrypt');
const { sendStudentRegistrationEmail, sendParentNotificationEmail } = require('../services/emailService');
const mongoose = require('mongoose');

// Import models directly
const User = require('../Models/User');
const Course = require('../Models/Course');
const Enrollment = require('../Models/Enrollment');
const ExamAttempt = require('../Models/ExamAttempt');
const Quiz = require('../Models/Practice'); // Assuming Quiz model might be named Practice
const QuizAttempt = require('../Models/QuizAttempt');

/**
 * Generate a random password of specified length
 * @param {number} length - Password length
 * @returns {string} - Generated password
 */
const generateRandomPassword = (length = 10) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

/**
 * Add a new student
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const addStudent = async (req, res) => {
  try {
    const { name, email, semester, branch, parentName, parentEmail } = req.body;

    // Check if student already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Generate random password
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = new UserModel({
      name,
      email,
      password: hashedPassword,
      isStudent: true,
      semester,
      branch,
      parentName,
      parentEmail
    });

    await student.save();

    // Send emails
    try {
      await sendStudentRegistrationEmail(email, name, password);
      await sendParentNotificationEmail(parentEmail, parentName, name, email);
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Continue with the response even if emails fail
    }

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      studentId: student._id
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all students with optional filters
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudents = async (req, res) => {
  try {
    const { semester, branch } = req.query;
    const filter = { isStudent: true };

    // Add filters if provided
    if (semester) filter.semester = semester;
    if (branch) filter.branch = branch;

    // Get students without returning password and explicitly populate branch and semester
    const students = await UserModel.find(filter)
      .select('-password')
      .populate({
        path: 'branch',
        select: 'name code description' // Include more fields
      })
      .populate({
        path: 'semester',
        select: 'name description' // Include more fields
      });

    // Log the results for debugging
    console.log('Students (first 2) with populated data:', 
      students.slice(0, 2).map(s => ({
        id: s._id,
        name: s.name,
        branch: s.branch,
        semester: s.semester
      }))
    );

    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get unique semesters and branches for filtering
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentFilters = async (req, res) => {
  try {
    // Fetch branches and semesters as objects with id and name
    const branches = await mongoose.model('branches').find({}, { name: 1 });
    const semesters = await mongoose.model('semesters').find({}, { name: 1 });
    
    console.log('Branches:', branches);
    console.log('Semesters:', semesters);

    res.status(200).json({
      success: true,
      filters: {
        semesters,
        branches
      }
    });
  } catch (error) {
    console.error('Error fetching student filters:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get dashboard data for a student
 * @route GET /students/dashboard
 * @access Private (Student only)
 */
const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get enrolled courses with progress
    const enrollments = await Enrollment.find({
      userId,
      isEnrolled: true
    }).populate({
      path: 'courseId',
      select: 'title description imageUrl createdBy',
      populate: {
        path: 'createdBy',
        select: 'name'
      }
    });
    
    // Transform enrollments to course progress data
    const courseProgress = enrollments.map(enrollment => {
      return {
        courseId: enrollment.courseId._id,
        courseTitle: enrollment.courseId.title,
        progress: enrollment.progress || 0,
        lastAccessed: formatTimeAgo(enrollment.lastAccessedAt),
        instructorName: enrollment.courseId.createdBy ? enrollment.courseId.createdBy.name : 'Unknown',
        // If section progress exists, calculate completed modules
        completedModules: enrollment.sectionProgress ? 
          enrollment.sectionProgress.reduce((total, section) => 
            total + section.moduleProgress.filter(mp => mp.isCompleted).length, 0) : 0,
        // Calculate total modules  
        modules: enrollment.sectionProgress ? 
          enrollment.sectionProgress.reduce((total, section) => 
            total + section.moduleProgress.length, 0) : 0
      };
    });
    
    // Get exam attempts (completed)
    const examAttempts = await ExamAttempt.find({
      userId,
      status: { $in: ['submitted', 'graded'] }
    }).populate({
      path: 'examId',
      select: 'title totalMarks passingMarks',
      populate: {
        path: 'courseId',
        select: 'title'
      }
    }).sort({ submittedAt: -1 }).limit(5);
    
    // Transform exam attempts
    const examResults = examAttempts.map(attempt => {
      return {
        examId: attempt.examId._id,
        attemptId: attempt._id,
        examTitle: attempt.examId.title,
        courseTitle: attempt.examId.courseId ? attempt.examId.courseId.title : '',
        date: attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'Unknown date',
        totalMarks: attempt.examId.totalMarks,
        marksAwarded: attempt.totalMarksAwarded || 0,
        percentage: attempt.percentage || 0,
        status: attempt.totalMarksAwarded >= attempt.examId.passingMarks ? 'pass' : 'fail',
        // If section data exists on the attempt
        sections: attempt.sections ? attempt.sections.map(section => ({
          sectionName: section.title,
          maxMarks: section.totalMarks,
          marksAwarded: section.marksAwarded || 0
        })) : []
      };
    });
    
    // Get quiz attempts
    const quizAttempts = await QuizAttempt.find({
      userId,
      isCompleted: true
    }).populate({
      path: 'quizId',
      select: 'title totalQuestions',
      populate: {
        path: 'courseId',
        select: 'title'
      }
    }).sort({ completedAt: -1 }).limit(5);
    
    // Transform quiz attempts
    const quizResults = quizAttempts.map(attempt => {
      return {
        quizId: attempt.quizId._id,
        attemptId: attempt._id,
        quizTitle: attempt.quizId.title,
        courseTitle: attempt.quizId.courseId ? attempt.quizId.courseId.title : '',
        date: attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Unknown date',
        totalQuestions: attempt.quizId.totalQuestions || attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers || 0,
        score: attempt.score || 0,
        status: (attempt.score >= 40) ? 'pass' : 'fail' // Assuming 40% is passing
      };
    });
    
    // Get recent activity (combine exam and quiz attempts, sort by date)
    const recentActivity = [...examAttempts, ...quizAttempts]
      .sort((a, b) => {
        const dateA = a.submittedAt || a.completedAt;
        const dateB = b.submittedAt || b.completedAt;
        return dateB - dateA;
      })
      .slice(0, 7)
      .map(activity => {
        const isExam = activity.examId !== undefined;
        const activityDate = activity.submittedAt || activity.completedAt;
        return {
          date: activityDate ? new Date(activityDate).toLocaleDateString() : 'Unknown date',
          activity: isExam ? 'Completed Exam' : 'Completed Quiz',
          title: isExam ? activity.examId.title : activity.quizId.title,
          course: isExam 
            ? (activity.examId.courseId ? activity.examId.courseId.title : '') 
            : (activity.quizId.courseId ? activity.quizId.courseId.title : ''),
          score: isExam 
            ? `${activity.totalMarksAwarded || 0}/${activity.examId.totalMarks}` 
            : `${activity.score}%`
        };
      });
    
    // Calculate overall progress as average of all course progress
    const overallProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((total, enrollment) => total + (enrollment.progress || 0), 0) / enrollments.length)
      : 0;
    
    // Get user info
    const user = await User.findById(userId);
    
    // Get a recent activity message
    let recentActivityMessage = "No recent activity";
    if (recentActivity.length > 0) {
      const mostRecent = recentActivity[0];
      recentActivityMessage = `${mostRecent.activity}: ${mostRecent.title}`;
    }
    
    // Build the response
    const dashboardData = {
      studentName: user.name,
      userEmail: user.email,
      recentActivity: recentActivityMessage,
      enrolledCourses: enrollments.length,
      completedCourses: enrollments.filter(e => e.progress === 100).length,
      overallProgress,
      courseProgress,
      examResults,
      quizResults,
      activityTimeline: recentActivity
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Error in getStudentDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// Helper function to format time elapsed
function formatTimeAgo(date) {
  if (!date) return "Never";
  
  const now = new Date();
  const elapsed = now - new Date(date);
  
  // Convert to seconds, minutes, hours, days
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  
  if (weeks > 0) {
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  } else if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    return "Just now";
  }
}

module.exports = {
  addStudent,
  getStudents,
  getStudentFilters,
  getStudentDashboard
}; 