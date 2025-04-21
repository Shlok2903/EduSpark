const Exam = require('../Models/Exam');
const Course = require('../Models/Course');
const User = require('../Models/User');
const Enrollment = require('../Models/Enrollment');
const ExamAttempt = require('../Models/ExamAttempt');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Helper function to safely convert to ObjectId
const toObjectId = (id) => {
  try {
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
    return null;
  } catch (error) {
    console.error('Error converting to ObjectId:', error);
    return null;
  }
};

/**
 * Create a new exam
 * @route POST /exams/create
 * @access Private (Teachers and Admins)
 */
exports.createExam = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      courseId,
      startTime,
      endTime,
      duration,
      negativeMarking,
      passingMarks,
      instructions,
      sections
    } = req.body;

    // Validate required fields
    if (!title || !courseId || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, courseId, startTime, endTime, and duration are required',
      });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if user has permission to create an exam for this course
    const userId = req.user._id || req.user.id;
    if (!req.user.isAdmin && !req.user.isTutor && course.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create an exam for this course',
      });
    }

    // Validate date and time
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for startTime or endTime',
      });
    }
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }
    
    if (parseInt(duration) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number',
      });
    }

    // Validate sections if provided
    if (sections && Array.isArray(sections)) {
      // Validate each section
      for (const section of sections) {
        if (!section.name) {
          return res.status(400).json({
            success: false,
            message: 'Each section must have a name',
          });
        }

        // Validate questions if provided
        if (section.questions && Array.isArray(section.questions)) {
          for (const question of section.questions) {
            if (!question.type || !question.question) {
              return res.status(400).json({
                success: false,
                message: 'Each question must have a type and question text',
              });
            }

            // Validate based on question type
            if (question.type === 'mcq') {
              if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
                return res.status(400).json({
                  success: false,
                  message: 'MCQ questions must have at least 2 options',
                });
              }
              
              if (question.correct_option === undefined || question.correct_option < 0 || question.correct_option >= question.options.length) {
                return res.status(400).json({
                  success: false,
                  message: 'MCQ questions must have a valid correct_option index',
                });
              }
              
              if (question.positiveMarks === undefined || question.positiveMarks <= 0) {
                return res.status(400).json({
                  success: false,
                  message: 'MCQ questions must have positive marks greater than 0',
                });
              }
            } else if (question.type === 'subjective' || question.type === 'fileUpload') {
              if (question.marks === undefined || question.marks <= 0) {
                return res.status(400).json({
                  success: false,
                  message: `${question.type} questions must have marks greater than 0`,
                });
              }
              
              if (question.type === 'fileUpload' && !question.fileType) {
                question.fileType = 'all'; // Set default fileType if not specified
              }
            }
          }
        }
      }
    }

    // Create the exam
    const newExam = new Exam({
      title,
      description,
      courseId,
      createdBy: userId,
      startTime,
      endTime,
      duration,
      negativeMarking: negativeMarking || false,
      passingMarks: passingMarks || 0,
      instructions: instructions || '',
      sections: sections || []
    });

    await newExam.save();

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: newExam
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating exam',
      error: error.message
    });
  }
};

/**
 * Get all exams for a course
 * @route GET /exams/course/:courseId
 * @access Private
 */
exports.getCourseExams = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format',
      });
    }
    
    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const userId = req.user._id || req.user.id;
    const isAdmin = req.user.isAdmin;
    const isTutor = req.user.isTutor;
    const isCreator = course.createdBy && course.createdBy.toString() === userId.toString();
    
    // Verify user is enrolled in the course if they're a student
    if (!isAdmin && !isTutor && !isCreator) {
      const enrollment = await Enrollment.findOne({
        userId,
        courseId,
        isEnrolled: true
      });
      
      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this course',
        });
      }
    }
    
    let exams;
    
    // If admin, tutor or course creator, get all exams (published and unpublished)
    if (isAdmin || isCreator || isTutor) {
      exams = await Exam.find({ courseId })
        .populate('createdBy', 'name email')
        .populate('courseId', 'title')
        .sort({ createdAt: -1 });
    } else {
      // For students, only return published exams
      exams = await Exam.find({ 
        courseId,
        isPublished: true
      })
        .populate('createdBy', 'name email')
        .populate('courseId', 'title')
        .sort({ createdAt: -1 });
        
      // Filter out sensitive information for students
      exams = exams.map(exam => {
        const examObj = exam.toObject();
        
        // For each section, remove correct answers from questions
        examObj.sections = examObj.sections.map(section => {
          section.questions = section.questions.map(question => {
            if (question.type === 'mcq') {
              const { correct_option, ...rest } = question;
              return rest;
            }
            return question;
          });
          return section;
        });
        
        return examObj;
      });
    }

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    console.error('Error fetching course exams:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exams',
      error: error.message
    });
  }
};

/**
 * Get exam by ID
 * @route GET /exams/:examId
 * @access Private
 */
exports.getExamById = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Validate examId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format',
      });
    }

    const exam = await Exam.findById(examId)
      .populate('createdBy', 'name email')
      .populate('courseId', 'title');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Check if user has permission to view the exam
    const userId = req.user._id || req.user.id;
    const isCreator = exam.createdBy._id.toString() === userId.toString();
    const isAdmin = req.user.isAdmin;
    const isTutor = req.user.isTutor;
    
    // If user is admin, creator or tutor, return full exam data
    if (isAdmin || isCreator || isTutor) {
      return res.status(200).json({
        success: true,
        data: exam,
        isCreator,
        isAdmin
      });
    }
    
    // If user is not admin or creator, check if exam is published
    if (!exam.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'This exam is not published yet',
      });
    }
    
    // Check if exam is still available (not expired)
    const now = new Date();
    if (now > new Date(exam.endTime)) {
      return res.status(403).json({
        success: false,
        message: 'This exam has expired',
      });
    }
    
    // For students, remove correct answers
    const examObj = exam.toObject();
    
    // For each section, remove correct answers from questions
    examObj.sections = examObj.sections.map(section => {
      section.questions = section.questions.map(question => {
        if (question.type === 'mcq') {
          const { correct_option, ...rest } = question;
          return rest;
        }
        return question;
      });
      return section;
    });

    res.status(200).json({
      success: true,
      data: examObj
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam',
      error: error.message
    });
  }
};

/**
 * Update an exam
 * @route PUT /exams/:examId
 * @access Private (Teachers and Admins)
 */
exports.updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const {
      title,
      description,
      courseId,
      startTime,
      endTime,
      duration,
      negativeMarking,
      passingMarks,
      instructions,
      sections
    } = req.body;

    // Validate examId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format',
      });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Check if user has permission to update
    const userId = req.user._id || req.user.id;
    if (!req.user.isAdmin && !req.user.isTutor && exam.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this exam',
      });
    }

    // Prevent updates to published exams that have attempts
    if (exam.isPublished) {
      const attempts = await ExamAttempt.countDocuments({ examId });
      if (attempts > 0) {
        return res.status(403).json({
          success: false,
          message: 'Cannot update an exam that already has attempts. Create a new exam instead.',
        });
      }
    }

    // If courseId is changing, validate it
    if (courseId && courseId !== exam.courseId.toString()) {
      // Validate course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      // Check if user has permission for the new course
      if (!req.user.isAdmin && !req.user.isTutor && course.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to add an exam to this course',
        });
      }
    }

    // Validate date and time if provided
    if (startTime || endTime) {
      const start = startTime ? new Date(startTime) : exam.startTime;
      const end = endTime ? new Date(endTime) : exam.endTime;
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format for startTime or endTime',
        });
      }
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time',
        });
      }
    }
    
    // Validate duration if provided
    if (duration !== undefined && parseInt(duration) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number',
      });
    }

    // Validate sections if provided
    if (sections && Array.isArray(sections)) {
      // Validate each section
      for (const section of sections) {
        if (!section.name) {
          return res.status(400).json({
            success: false,
            message: 'Each section must have a name',
          });
        }

        // Validate questions if provided
        if (section.questions && Array.isArray(section.questions)) {
          for (const question of section.questions) {
            if (!question.type || !question.question) {
              return res.status(400).json({
                success: false,
                message: 'Each question must have a type and question text',
              });
            }

            // Validate based on question type
            if (question.type === 'mcq') {
              if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
                return res.status(400).json({
                  success: false,
                  message: 'MCQ questions must have at least 2 options',
                });
              }
              
              if (question.correct_option === undefined || question.correct_option < 0 || question.correct_option >= question.options.length) {
                return res.status(400).json({
                  success: false,
                  message: 'MCQ questions must have a valid correct_option index',
                });
              }
              
              if (question.positiveMarks === undefined || question.positiveMarks <= 0) {
                return res.status(400).json({
                  success: false,
                  message: 'MCQ questions must have positive marks greater than 0',
                });
              }
            } else if (question.type === 'subjective' || question.type === 'fileUpload') {
              if (question.marks === undefined || question.marks <= 0) {
                return res.status(400).json({
                  success: false,
                  message: `${question.type} questions must have marks greater than 0`,
                });
              }
              
              if (question.type === 'fileUpload' && !question.fileType) {
                question.fileType = 'all'; // Set default fileType if not specified
              }
            }
          }
        }
      }
    }

    // Update the exam
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(courseId && { courseId }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(duration !== undefined && { duration }),
        ...(negativeMarking !== undefined && { negativeMarking }),
        ...(passingMarks !== undefined && { passingMarks }),
        ...(instructions !== undefined && { instructions }),
        ...(sections && { sections }),
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
      .populate('courseId', 'title');

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: updatedExam
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exam',
      error: error.message
    });
  }
};

/**
 * Delete an exam
 * @route DELETE /exams/:examId
 * @access Private (Teachers and Admins)
 */
exports.deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Validate examId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format',
      });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Check if user has permission to delete
    const userId = req.user._id || req.user.id;
    if (!req.user.isAdmin && !req.user.isTutor && exam.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this exam',
      });
    }

    // Check if there are any attempts for this exam
    const attemptsCount = await ExamAttempt.countDocuments({ examId });
    if (attemptsCount > 0) {
      // Either prevent deletion or provide warning
      if (req.user.isAdmin) {
        // Allow admin to force delete with warning
        await ExamAttempt.deleteMany({ examId });
        console.log(`Admin deleted exam with ${attemptsCount} attempts`);
      } else {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete an exam that has attempts. Please contact an administrator.',
          attemptsCount
        });
      }
    }

    // Delete the exam
    await Exam.findByIdAndDelete(examId);

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting exam',
      error: error.message
    });
  }
};

/**
 * Update exam publish status
 * @route PUT /exams/:examId/publish
 * @access Private (Teachers and Admins)
 */
exports.updatePublishStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const { isPublished } = req.body;
    
    // Validate examId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format',
      });
    }
    
    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }
    
    // Verify user has permission to publish/unpublish
    const userId = req.user._id || req.user.id;
    const isAdmin = req.user.isAdmin;
    const isTutor = req.user.isTutor;
    
    if (!isAdmin && !isTutor && exam.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this exam',
      });
    }
    
    // If trying to publish, validate the exam has questions
    if (isPublished === true) {
      // Check if the exam has at least one section with at least one question
      const hasQuestions = exam.sections && 
                          exam.sections.length > 0 && 
                          exam.sections.some(section => 
                            section.questions && section.questions.length > 0
                          );
      
      if (!hasQuestions) {
        return res.status(400).json({
          success: false,
          message: 'Cannot publish an exam without questions. Please add at least one question.',
        });
      }
    }

    // Update the publish status
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      { isPublished, updatedAt: Date.now() },
      { new: true }
    ).populate('createdBy', 'name email')
      .populate('courseId', 'title');

    res.status(200).json({
      success: true,
      message: `Exam ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: updatedExam
    });
  } catch (error) {
    console.error('Error updating exam publish status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exam publish status',
      error: error.message
    });
  }
};

// Get all exams for a user's enrolled courses
exports.getUserExams = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let exams;
    let response = {
      upcoming: [],
      live: [],
      completed: []
    };
    
    const now = new Date();

    // If user is admin or tutor, get all exams
    if (user.isAdmin || user.isTutor) {
      exams = await Exam.find({})
        .populate('courseId', 'title')
        .populate('createdBy', 'name email')
        .sort({ startTime: 1 });
        
      // For teachers, categorize exams differently
      response = {
        published: exams.filter(exam => exam.isPublished),
        drafts: exams.filter(exam => !exam.isPublished),
      };
    } else {
      // Get enrolled courses for student
      const enrollments = await Enrollment.find({ 
        userId: userId,
        isEnrolled: true 
      });
      
      const enrolledCourseIds = enrollments.map(enrollment => enrollment.courseId);
      
      // Get published exams for enrolled courses
      exams = await Exam.find({
        courseId: { $in: enrolledCourseIds },
        isPublished: true
      })
        .populate('courseId', 'title')
        .populate('createdBy', 'name email')
        .sort({ startTime: 1 });
      
      // Get all exam attempts for this user
      const examAttempts = await ExamAttempt.find({
        userId: userId
      });
      
      // Process exams to include attempt status
      exams = exams.map(exam => {
        const examObj = exam.toObject();
        
        // Find attempt for this exam
        const attempt = examAttempts.find(a => a.examId.toString() === exam._id.toString());
        
        if (attempt) {
          examObj.attemptId = attempt._id;
          
          // Set status based on attempt status
          if (attempt.status === 'in-progress') {
            examObj.status = 'attempted';  // Started but not submitted
          } else if (attempt.status === 'submitted') {
            examObj.status = 'submitted';  // Submitted but not graded
          } else if (attempt.status === 'graded' || attempt.status === 'timed-out') {
            examObj.status = 'completed';  // Completed (graded or timed-out)
          }
          
          // Add attempt info
          examObj.studentSubmitted = attempt.status !== 'in-progress';
          if (attempt.totalMarksAwarded !== undefined) {
            examObj.totalMarksAwarded = attempt.totalMarksAwarded;
          }
          if (attempt.percentage !== undefined) {
            examObj.percentage = attempt.percentage;
          }
        } else {
          examObj.status = 'not-started';  // Not attempted yet
        }
        
        return examObj;
      });
      
      // Categorize exams for students
      response = {
        upcoming: exams.filter(exam => new Date(exam.startTime) > now),
        live: exams.filter(exam => 
          new Date(exam.startTime) <= now && 
          new Date(exam.endTime) >= now
        ),
        completed: exams.filter(exam => new Date(exam.endTime) < now)
      };
    }

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching user exams:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exams',
      error: error.message
    });
  }
};

/**
 * Start an exam attempt
 * @route POST /exams/:examId/attempt/start
 * @access Private
 */
exports.startExamAttempt = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;
    const { startTime } = req.body;

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if exam is published
    if (!exam.isPublished) {
      return res.status(403).json({ 
        success: false,
        message: 'This exam is not available yet'
      });
    }

    // Check if exam has started and not ended
    const now = new Date();
    const examStartTime = new Date(exam.startTime);
    const examEndTime = new Date(exam.endTime);

    if (now < examStartTime) {
      return res.status(403).json({ 
        success: false,
        message: 'This exam has not started yet'
      });
    }

    if (now > examEndTime) {
      return res.status(403).json({ 
        success: false,
        message: 'This exam has already ended'
      });
    }

    // Check if the user is enrolled in the course
    const isEnrolled = await Enrollment.exists({ 
      userId, 
      courseId: exam.courseId,
      isEnrolled: true
    });

    if (!isEnrolled) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Check if user has already submitted an attempt for this exam
    const existingCompletedAttempt = await ExamAttempt.findOne({
      userId,
      examId,
      status: { $in: ['submitted', 'graded', 'timed-out'] }
    });

    if (existingCompletedAttempt) {
      return res.status(403).json({ 
        success: false,
        message: 'You have already completed this exam',
        attemptId: existingCompletedAttempt._id
      });
    }

    // Check if there's an in-progress attempt
    let attempt = await ExamAttempt.findOne({
      userId,
      examId,
      status: 'in-progress'
    });

    // If there's an existing attempt, use it; otherwise create a new one
    if (attempt) {
      // Calculate time remaining
      const attemptStartTime = new Date(attempt.startTime);
      const elapsedSeconds = Math.floor((now - attemptStartTime) / 1000);
      const durationSeconds = exam.duration * 60;
      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      // If time has expired, mark as timed-out
      if (remainingSeconds <= 0) {
        attempt.status = 'timed-out';
        attempt.completedTime = now;
        await attempt.save();

        return res.status(403).json({
          success: false,
          message: 'Your time for this exam has expired',
          attemptId: attempt._id
        });
      }
    } else {
      // Initialize sections for the new attempt
      const attemptSections = exam.sections.map(section => ({
        sectionId: section._id,
        answers: section.questions.map(question => ({
          questionId: question._id,
          answer: "",
          selectedOption: null,
          isGraded: false,
          marksAwarded: 0
        }))
      }));

      // Create a new attempt
      attempt = new ExamAttempt({
        userId,
        examId,
        startTime: startTime || now,
        status: 'in-progress',
        sections: attemptSections
      });
      await attempt.save();
    }

    // Prepare exam data (flatten questions for the frontend and sanitize)
    const sanitizedQuestions = [];
    
    // Extract questions from all sections and sanitize them
    exam.sections.forEach(section => {
      section.questions.forEach(question => {
        const sanitizedQuestion = {
          _id: question._id,
          text: question.question,
          question: question.question,
          type: question.type,
          section: {
            _id: section._id,
            name: section.name
          }
        };
        
        // Include options for MCQ but exclude the correct answer
        if (question.type === 'mcq') {
          sanitizedQuestion.options = question.options.map(opt => ({ text: opt.text }));
        }
        
        // Add marks for display purposes
        if (question.type === 'mcq') {
          sanitizedQuestion.marks = question.positiveMarks;
        } else {
          sanitizedQuestion.marks = question.marks;
        }
        
        sanitizedQuestions.push(sanitizedQuestion);
      });
    });

    // Respond with exam data and attempt
    res.status(200).json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          startTime: exam.startTime,
          endTime: exam.endTime,
          duration: exam.duration,
          totalMarks: exam.total_marks,
          instructions: exam.instructions
        },
        questions: sanitizedQuestions,
        startTime: attempt.startTime
      }
    });
  } catch (error) {
    console.error('Error starting exam attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting exam attempt',
      error: error.message
    });
  }
};

/**
 * Get exam attempt status
 * @route GET /exams/:examId/attempt/status
 * @access Private
 */
exports.getExamAttemptStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found'
      });
    }

    // Find the attempt
    const attempt = await ExamAttempt.findOne({
      userId,
      examId
    }).sort({ createdAt: -1 }); // Get the most recent attempt

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No attempt found for this exam'
      });
    }

    // Calculate time remaining if the attempt is in progress
    let timeRemaining = 0;
    if (attempt.status === 'in-progress') {
      const now = new Date();
      const attemptStartTime = new Date(attempt.startTime);
      const elapsedSeconds = Math.floor((now - attemptStartTime) / 1000);
      const durationSeconds = exam.duration * 60;
      timeRemaining = Math.max(0, durationSeconds - elapsedSeconds);

      // If time has expired, mark as timed-out
      if (timeRemaining <= 0) {
        attempt.status = 'timed-out';
        attempt.completedTime = now;
        await attempt.save();
      }
    }

    // Convert section-based answers to flat format for frontend
    const flatAnswers = [];
    attempt.sections.forEach(section => {
      section.answers.forEach(answer => {
        // Find the question to get its type
        let questionType = 'unknown';
        exam.sections.forEach(examSection => {
          if (examSection._id.toString() === section.sectionId.toString()) {
            const question = examSection.questions.find(q => 
              q._id.toString() === answer.questionId.toString()
            );
            if (question) {
              questionType = question.type;
            }
          }
        });
        
        flatAnswers.push({
          questionId: answer.questionId,
          answer: answer.answer,
          type: questionType,
          // Include additional fields that might be useful
          isGraded: answer.isGraded,
          marksAwarded: answer.marksAwarded,
          // Add question text if found
          question: (() => {
            let questionText = '';
            exam.sections.forEach(examSection => {
              if (examSection._id.toString() === section.sectionId.toString()) {
                const question = examSection.questions.find(q => 
                  q._id.toString() === answer.questionId.toString()
                );
                if (question) {
                  questionText = question.question;
                }
              }
            });
            return questionText;
          })()
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        startTime: attempt.startTime,
        timeRemaining,
        answers: flatAnswers
      }
    });
  } catch (error) {
    console.error('Error getting exam attempt status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting exam attempt status',
      error: error.message
    });
  }
};

/**
 * Submit exam attempt with file uploads
 * @route POST /exams/attempt/submit-with-files
 * @access Private
 */
exports.submitExamAttemptWithFiles = async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    console.log('Processing file upload submission:', { examId, userId });
    console.log('Files received:', files.length);

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID is required'
      });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found'
      });
    }

    // Find the attempt
    let attempt = await ExamAttempt.findOne({
      userId,
      examId,
      status: 'in-progress'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active attempt found for this exam'
      });
    }

    // Check if time has expired
    const now = new Date();
    const attemptStartTime = new Date(attempt.startTime);
    const elapsedSeconds = Math.floor((now - attemptStartTime) / 1000);
    const durationSeconds = exam.duration * 60;
    
    if (elapsedSeconds > durationSeconds) {
      attempt.status = 'timed-out';
    } else {
      attempt.status = 'submitted';
    }

    // Process the files and create a map of questionId -> file
    const fileMap = {};
    files.forEach(file => {
      // Extract questionId from field name (format: "files[questionId]")
      const match = file.fieldname.match(/files\[(.*?)\]/);
      if (match && match[1]) {
        const questionId = match[1];
        fileMap[questionId] = {
          path: file.path,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        };
      }
    });

    console.log(`Processed ${Object.keys(fileMap).length} files for different questions`);

    // Parse answers from the request body
    const answers = [];
    const bodyKeys = Object.keys(req.body);
    console.log('Form data keys:', bodyKeys);

    bodyKeys.forEach(key => {
      if (key.startsWith('answers[') && key.endsWith('][questionId]')) {
        const match = key.match(/answers\[([^\]]+)\]/);
        if (match && match[1]) {
          const index = match[1];
          const questionId = req.body[key];
          const answer = req.body[`answers[${index}][answer]`] || '';
          const type = req.body[`answers[${index}][type]`] || 'text';
          
          // Check if we have a file for this question
          let filePath = null;
          let fileName = null;
          
          if (fileMap[questionId]) {
            filePath = fileMap[questionId].path;
            fileName = fileMap[questionId].filename;
            console.log(`File matched for question ${questionId}:`, { fileName, filePath });
          }
          
          answers.push({
            questionId,
            answer,
            type,
            filePath,
            fileName
          });
        }
      }
    });

    console.log(`Processed ${answers.length} answers, including file uploads`);

    // Convert flat answers to section-based structure
    const sectionAnswers = {};
    
      for (const answer of answers) {
        // Find which section this question belongs to
        let foundSection = null;
        
        // Search through all sections for the question
        for (const section of exam.sections) {
        const questionExists = section.questions.some(q => 
            q._id.toString() === answer.questionId);
            
        if (questionExists) {
            foundSection = section;
            break;
          }
        }
        
      if (foundSection) {
          const sectionId = foundSection._id.toString();
          
          // Initialize section if not already done
          if (!sectionAnswers[sectionId]) {
            sectionAnswers[sectionId] = {
              sectionId,
              answers: []
            };
          }
          
          // Add answer to appropriate section
        sectionAnswers[sectionId].answers.push({
            questionId: answer.questionId,
            answer: answer.answer || "",
          filePath: answer.filePath,
          fileName: answer.fileName,
            selectedOption: null,
            isGraded: false,
            marksAwarded: 0
        });
      }
    }

    // Update the attempt with answers
    attempt.sections = Object.values(sectionAnswers);
    attempt.completedTime = now;

      await attempt.save();
    console.log('Exam attempt saved successfully');

    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        attemptId: attempt._id
      }
    });
  } catch (error) {
    console.error('Error submitting exam with files:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting exam',
      error: error.message
    });
  }
};

/**
 * Save exam progress
 * @route POST /exams/attempt/progress
 * @access Private
 */
exports.saveExamProgress = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const userId = req.user.id;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID is required'
      });
    }

    // Find the attempt
    const attempt = await ExamAttempt.findOne({
      userId,
      examId,
      status: 'in-progress'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active attempt found for this exam'
      });
    }

    // Find the exam to get section/question structure
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Process answers and update the attempt's sections
    if (answers && answers.length > 0) {
      // Map to track which questions are in which sections
      const questionToSectionMap = {};
      
      // Build a map of questionId -> sectionId for quick lookup
      exam.sections.forEach(section => {
        section.questions.forEach(question => {
          questionToSectionMap[question._id.toString()] = section._id.toString();
        });
      });

      // Process each answer
      for (const answer of answers) {
        const questionId = answer.questionId;
        const sectionId = questionToSectionMap[questionId];
        
        // Skip if we can't find the section this question belongs to
        if (!sectionId) continue;
        
        // Find the section in the attempt
        const sectionIndex = attempt.sections.findIndex(s => 
          s.sectionId.toString() === sectionId
        );
        
        // If section is found
        if (sectionIndex >= 0) {
          // Find the answer for this question
          const answerIndex = attempt.sections[sectionIndex].answers.findIndex(a => 
            a.questionId.toString() === questionId
          );
          
          // If answer exists, update it
          if (answerIndex >= 0) {
            attempt.sections[sectionIndex].answers[answerIndex].answer = answer.answer || "";
            
            // Check if this is an MCQ question
            const question = exam.sections.find(s => s._id.toString() === sectionId)
              .questions.find(q => q._id.toString() === questionId);
              
            if (question && question.type === 'mcq') {
              // Try to find the selected option index
              const optionIndex = question.options.findIndex(
                opt => opt.text === answer.answer
              );
              
              if (optionIndex >= 0) {
                attempt.sections[sectionIndex].answers[answerIndex].selectedOption = optionIndex;
              }
            }
          } 
          // If answer doesn't exist for this question, add it
          else {
            attempt.sections[sectionIndex].answers.push({
              questionId,
              answer: answer.answer || "",
              selectedOption: null,
              isGraded: false,
              marksAwarded: 0
            });
          }
        }
        // If section doesn't exist in attempt (shouldn't happen, but just in case)
        else {
          attempt.sections.push({
            sectionId,
            answers: [{
              questionId,
              answer: answer.answer || "",
              selectedOption: null,
              isGraded: false,
              marksAwarded: 0
            }]
          });
        }
      }
      
      // Save the updated attempt
      await attempt.save();
    }

    res.status(200).json({
      success: true,
      message: 'Progress saved successfully'
    });
  } catch (error) {
    console.error('Error saving exam progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving exam progress',
      error: error.message
    });
  }
};

// Get all attempts for an exam (teacher view)
exports.getExamAttempts = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    // Find exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user is authorized to view attempts
    const course = await Course.findById(exam.courseId);
    if (course.createdBy.toString() !== userId && !req.user.isAdmin && !req.user.isTutor) {
      return res.status(403).json({ message: 'You do not have permission to view exam attempts' });
    }

    // Get all attempts
    const attempts = await ExamAttempt.find({ examId })
      .populate('userId', 'name email')
      .select('-sections');

    return res.status(200).json(attempts);
  } catch (error) {
    console.error('Error in getExamAttempts:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific attempt (for grading)
exports.getAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId)
      .populate('userId', 'name email')
      .populate('examId');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    // Check permissions
    const isTeacher = req.user.isAdmin || req.user.isTutor;
    const isOwner = attempt.userId._id.toString() === userId;
    
    if (!isTeacher && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to view this attempt' });
    }

    // Get exam details
    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    return res.status(200).json({
      attempt,
      exam,
      isTeacher
    });
  } catch (error) {
    console.error('Error in getAttemptById:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Grade an exam attempt (teacher only)
exports.gradeAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { grades } = req.body;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    // Check if user is authorized to grade
    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    const course = await Course.findById(exam.courseId);
    if (course.createdBy.toString() !== userId && !req.user.isAdmin && !req.user.isTutor) {
      return res.status(403).json({ message: 'You do not have permission to grade this attempt' });
    }

    // Update grades for each answer
    let allGraded = true;
    
    for (const sectionId in grades) {
      const sectionIndex = attempt.sections.findIndex(
        section => section.sectionId.toString() === sectionId
      );
      
      if (sectionIndex >= 0) {
        for (const questionId in grades[sectionId]) {
          const answerIndex = attempt.sections[sectionIndex].answers.findIndex(
            answer => answer.questionId.toString() === questionId
          );
          
          if (answerIndex >= 0) {
            const { marksAwarded, feedback } = grades[sectionId][questionId];
            
            // Update grade
            attempt.sections[sectionIndex].answers[answerIndex].marksAwarded = marksAwarded;
            attempt.sections[sectionIndex].answers[answerIndex].feedback = feedback;
            attempt.sections[sectionIndex].answers[answerIndex].isGraded = true;
          }
        }
      }
    }

    // Check if all questions are graded
    allGraded = attempt.sections.every(section => 
      section.answers.every(answer => answer.isGraded)
    );

    // Update attempt status if all graded
    if (allGraded) {
      attempt.isGraded = true;
      attempt.status = 'graded';
    }

    await attempt.save();

    return res.status(200).json({
      message: 'Grades updated successfully',
      attempt
    });
  } catch (error) {
    console.error('Error in gradeAttempt:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all my exam attempts (student view)
exports.getMyAttempts = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('Fetching exam attempts for user:', userId);

    // Get all attempts for this user
    const attempts = await ExamAttempt.find({ userId })
      .populate({
        path: 'examId',
        select: 'title description totalMarks passingMarks',
        populate: {
          path: 'courseId',
          select: 'title'
        }
      })
      .select('-sections')
      .sort({ submittedAt: -1 });

    console.log(`Found ${attempts.length} attempts for user ${userId}`);
    
    return res.status(200).json(attempts);
  } catch (error) {
    console.error('Error in getMyAttempts:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Legacy function for backward compatibility
exports.startExam = async (req, res) => {
  try {
    // Directly handle the request similar to startExamAttempt
    const { examId } = req.params;
    const userId = req.user.id;
    const now = new Date();

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found',
        errorCode: 'EXAM_NOT_FOUND'
      });
    }

    // Check if exam is published
    if (!exam.isPublished) {
      return res.status(403).json({ 
        success: false,
        message: 'This exam is not available yet', 
        errorCode: 'EXAM_NOT_PUBLISHED'
      });
    }

    // Check if exam has started and not ended
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) {
      return res.status(403).json({ 
        success: false,
        message: 'This exam has not started yet',
        examStartTime: startTime,
        errorCode: 'EXAM_NOT_STARTED'
      });
    }

    if (now > endTime) {
      return res.status(403).json({ 
        success: false,
        message: 'This exam has already ended',
        errorCode: 'EXAM_ENDED'
      });
    }

    // Check if the user is enrolled in the course
    const isEnrolled = await Enrollment.exists({ 
      userId, 
      courseId: exam.courseId,
      isEnrolled: true
    });

    if (!isEnrolled) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not enrolled in this course',
        errorCode: 'NOT_ENROLLED'
      });
    }

    // Check if user has already attempted this exam
    const existingAttempt = await ExamAttempt.findOne({
      userId,
      examId,
    });

    // If attempt exists and is submitted, don't allow retake
    if (existingAttempt && existingAttempt.status !== 'in-progress') {
      return res.status(200).json({
        success: false,
        message: 'You have already completed this exam',
        errorCode: 'ALREADY_COMPLETED',
        attemptDetails: {
          _id: existingAttempt._id,
          status: existingAttempt.status,
          submittedAt: existingAttempt.submittedAt,
          totalMarksAwarded: existingAttempt.totalMarksAwarded,
          percentage: existingAttempt.percentage,
          redirectUrl: `/exams/result/${existingAttempt._id}`
        }
      });
    }

    // If there's an existing in-progress attempt, use it
    if (existingAttempt && existingAttempt.status === 'in-progress') {
      // Calculate time remaining
      const elapsedSeconds = Math.floor((now - new Date(existingAttempt.startTime)) / 1000);
      const durationSeconds = exam.duration * 60;
      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      // If time has expired, mark as timed-out
      if (remainingSeconds <= 0) {
        existingAttempt.status = 'timed-out';
        existingAttempt.completedTime = now;
        await existingAttempt.save();

        return res.status(403).json({
          success: false,
          message: 'Your time for this exam has expired',
          errorCode: 'TIME_EXPIRED'
        });
      }

      // Return the existing attempt
      return res.status(200).json({
        success: true,
        attempt: existingAttempt,
        exam: {
          _id: exam._id,
          title: exam.title,
          duration: exam.duration,
          sections: exam.sections,
          endTime: exam.endTime
        }
      });
    }

    // Create a new attempt
    const newAttempt = new ExamAttempt({
      userId,
      examId,
      startTime: now,
      status: 'in-progress',
      answers: []
    });

    await newAttempt.save();

    return res.status(201).json({
      success: true,
      message: 'Exam attempt started',
      attempt: newAttempt,
      exam: {
        _id: exam._id,
        title: exam.title,
        duration: exam.duration,
        sections: exam.sections,
        endTime: exam.endTime
      }
    });
  } catch (error) {
    console.error('Error in startExam:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message
    });
  }
};

// Legacy function for backward compatibility
exports.submitExam = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam attempt not found' 
      });
    }

    // Verify this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to submit this attempt' 
      });
    }

    // Check if attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ 
        success: false,
        message: 'This exam attempt has already been submitted' 
      });
    }

    // Get the exam to check questions
    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({ 
        message: 'Exam not found' 
      });
    }

    // Use the answers from the attempt
    const now = new Date();
    attempt.status = 'submitted';
    attempt.completedTime = now;
    await attempt.save();

    return res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      attempt
    });
  } catch (error) {
    console.error('Error in submitExam:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message
    });
  }
};

// Legacy function for backward compatibility
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded' 
      });
    }

    const { attemptId, sectionId, questionId } = req.params;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam attempt not found' 
      });
    }

    // Verify this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to modify this attempt' 
      });
    }

    // Check if attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ 
        success: false,
        message: 'This exam attempt has already been submitted' 
      });
    }

    // Update the file path in answers
    // Find the answer with matching questionId
    const answerIndex = attempt.answers.findIndex(
      answer => answer.questionId.toString() === questionId
    );
    
    if (answerIndex >= 0) {
      attempt.answers[answerIndex].filePath = req.file.path;
      attempt.answers[answerIndex].fileName = req.file.originalname;
    } else {
      // If answer doesn't exist, create it
      attempt.answers.push({
        questionId,
        filePath: req.file.path,
        fileName: req.file.originalname,
        type: 'file'
      });
    }
    
    await attempt.save();

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      filePath: req.file.path
    });
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message
    });
  }
};

// Legacy function for backward compatibility
exports.saveExamProgress = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam attempt not found' 
      });
    }

    // Verify this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to modify this attempt' 
      });
    }

    // Check if attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ 
        success: false,
        message: 'This exam attempt has already been submitted' 
      });
    }

    // Update answers if provided
    if (answers) {
      attempt.answers = answers;
    }

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: 'Exam progress saved successfully'
    });
  } catch (error) {
    console.error('Error in saveExamProgress:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message
    });
  }
};

/**
 * Submit exam attempt
 * @route POST /exams/attempt/submit
 * @access Private
 */
exports.submitExamAttempt = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const userId = req.user.id;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID is required'
      });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false,
        message: 'Exam not found'
      });
    }

    // Find the attempt
    let attempt = await ExamAttempt.findOne({
      userId,
      examId,
      status: 'in-progress'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active attempt found for this exam'
      });
    }

    // Check if time has expired
    const now = new Date();
    const attemptStartTime = new Date(attempt.startTime);
    const elapsedSeconds = Math.floor((now - attemptStartTime) / 1000);
    const durationSeconds = exam.duration * 60;
    
    if (elapsedSeconds > durationSeconds) {
      attempt.status = 'timed-out';
    } else {
      attempt.status = 'submitted';
    }

    // Process answers and organize by sections
    const sectionAnswers = {};
    
    if (answers && answers.length > 0) {
      // Convert flat answers array to section-based structure
      for (const answer of answers) {
        // Find which section this question belongs to
        let foundSection = null;
        
        // Search through all sections for the question
        for (const section of exam.sections) {
          const question = section.questions.find(q => 
            q._id.toString() === answer.questionId);
            
          if (question) {
            foundSection = section;
            break;
          }
        }
        
        if (foundSection) {
          const sectionId = foundSection._id.toString();
          
          // Initialize section if not already done
          if (!sectionAnswers[sectionId]) {
            sectionAnswers[sectionId] = {
              sectionId,
              answers: []
            };
          }
          
          // Add answer to appropriate section
          const processedAnswer = {
            questionId: answer.questionId,
            answer: answer.answer || "",
            selectedOption: null,
            isGraded: false,
            marksAwarded: 0
          };
          
          // Handle different question types
          if (foundQuestion.type === 'mcq') {
            // For MCQ, convert answer to selectedOption
            // Try to find the index of the selected option
            const optionIndex = foundQuestion.options.findIndex(
              opt => opt.text === answer.answer
            );
            
            if (optionIndex >= 0) {
              processedAnswer.selectedOption = optionIndex;
              
              // Auto-grade MCQ
              if (optionIndex === foundQuestion.correct_option) {
                processedAnswer.marksAwarded = foundQuestion.positiveMarks;
                processedAnswer.isGraded = true;
              } else if (exam.negativeMarking && foundQuestion.negativeMarks) {
                processedAnswer.marksAwarded = -foundQuestion.negativeMarks;
                processedAnswer.isGraded = true;
              } else {
                processedAnswer.marksAwarded = 0;
                processedAnswer.isGraded = true;
              }
            }
          }
          
          sectionAnswers[sectionId].answers.push(processedAnswer);
        }
      }
    }

    // Update attempt with organized answers
    attempt.sections = Object.values(sectionAnswers);
    attempt.completedTime = now;

    await attempt.save();

    // Calculate grades automatically (for MCQs)
    const isFullyGraded = attempt.checkIfFullyGraded();
    if (isFullyGraded) {
      attempt.isGraded = true;
      attempt.status = 'graded';
      await attempt.save();
    }

    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        totalMarksAwarded: attempt.totalMarksAwarded,
        totalMarksPossible: exam.total_marks,
        percentage: attempt.percentage
      }
    });
  } catch (error) {
    console.error('Error submitting exam attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting exam attempt',
      error: error.message
    });
  }
}; 