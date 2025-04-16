const { Exam, ExamAttempt, Course, User, Enrollment } = require('../Models');
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

// Create a new exam
exports.createExam = async (req, res) => {
  try {
    const { title, description, courseId, sections, duration, startTime, endTime, isPublished } = req.body;
    const userId = req.user.id;

    // Validate course exists and user has permission
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course creator or an admin
    if (course.createdBy.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to create exams for this course' });
    }

    // Handle date strings properly
    let parsedStartTime, parsedEndTime;
    
    try {
      parsedStartTime = new Date(startTime);
      parsedEndTime = new Date(endTime);
    } catch (err) {
      console.error('Error parsing date:', err);
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Create new exam
    const newExam = new Exam({
      title,
      description,
      courseId,
      createdBy: userId,
      sections: sections || [],
      duration,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      isPublished: isPublished || false
    });

    await newExam.save();

    return res.status(201).json({
      message: 'Exam created successfully',
      exam: newExam
    });
  } catch (error) {
    console.error('Error in createExam:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all exams for a course
exports.getCourseExams = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Convert courseId to a valid ObjectId
    const courseObjectId = toObjectId(courseId);
    if (!courseObjectId) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    // Check if course exists
    const course = await Course.findById(courseObjectId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Retrieve exams
    let exams;
    
    if (course.createdBy.toString() === userId || req.user.isAdmin || req.user.isTutor) {
      // Teachers/admins can see all exams including unpublished ones
      exams = await Exam.find({ courseId: courseObjectId }).populate('createdBy', 'name email');
    } else {
      // Students can only see published exams
      exams = await Exam.find({ 
        courseId: courseObjectId, 
        isPublished: true,
        endTime: { $gte: new Date() } // Only show active or future exams
      }).populate('createdBy', 'name email');
      
      // For each exam, check if student has attempted it
      const examIds = exams.map(exam => exam._id);
      const attempts = await ExamAttempt.find({
        userId,
        examId: { $in: examIds }
      });
      
      // Add attempt status to each exam
      exams = exams.map(exam => {
        const attempt = attempts.find(a => a.examId.toString() === exam._id.toString());
        
        return {
          ...exam.toObject(),
          attemptStatus: attempt ? attempt.status : null,
          attemptId: attempt ? attempt._id : null
        };
      });
    }

    return res.status(200).json(exams);
  } catch (error) {
    console.error('Error in getCourseExams:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get an exam by ID
exports.getExamById = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    const exam = await Exam.findById(examId)
      .populate('createdBy', 'name email')
      .populate('courseId', 'title');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user has access to this exam
    const course = await Course.findById(exam.courseId);
    const isTeacher = course.createdBy.toString() === userId || req.user.isAdmin || req.user.isTutor;
    
    if (!isTeacher && (!exam.isPublished || new Date() > new Date(exam.endTime))) {
      return res.status(403).json({ message: 'You do not have access to this exam' });
    }

    // Check if student has attempted this exam
    let attemptInfo = null;
    if (!isTeacher) {
      const attempt = await ExamAttempt.findOne({
        userId,
        examId: exam._id
      });
      
      if (attempt) {
        attemptInfo = {
          attemptId: attempt._id,
          status: attempt.status,
          startTime: attempt.startTime,
          endTime: attempt.endTime,
          totalMarksAwarded: attempt.totalMarksAwarded,
          percentage: attempt.percentage
        };
      }
    }

    // Log the exam times for debugging
    console.log('Sending exam times to client:', {
      startTime: exam.startTime,
      endTime: exam.endTime,
      isTeacher
    });

    return res.status(200).json({
      exam: {
        ...exam.toObject(),
        // Ensure dates are in ISO format for consistent handling across timezones
        startTime: exam.startTime.toISOString(),
        endTime: exam.endTime.toISOString()
      },
      isTeacher,
      attemptInfo
    });
  } catch (error) {
    console.error('Error in getExamById:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an exam
exports.updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    // Find exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user is authorized to update this exam
    if (exam.createdBy.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to update this exam' });
    }

    // Check if exam has already been attempted
    const hasAttempts = await ExamAttempt.exists({ examId });
    if (hasAttempts) {
      // Limit what can be updated if exam has been attempted
      const safeUpdates = {};
      
      // Only allow updating these fields
      if (updates.title) safeUpdates.title = updates.title;
      if (updates.description) safeUpdates.description = updates.description;
      if (updates.endTime) safeUpdates.endTime = updates.endTime;
      if (updates.isPublished !== undefined) safeUpdates.isPublished = updates.isPublished;
      
      // Update the exam with safe updates
      const updatedExam = await Exam.findByIdAndUpdate(
        examId,
        { $set: safeUpdates },
        { new: true }
      );
      
      return res.status(200).json({
        message: 'Exam partially updated. Some fields were not updated because the exam has already been attempted.',
        exam: updatedExam
      });
    }
    
    // If no attempts, full update is allowed
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      { $set: updates },
      { new: true }
    );

    return res.status(200).json({
      message: 'Exam updated successfully',
      exam: updatedExam
    });
  } catch (error) {
    console.error('Error in updateExam:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an exam
exports.deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    // Find exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user is authorized to delete this exam
    if (exam.createdBy.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this exam' });
    }

    // Check if exam has already been attempted
    const hasAttempts = await ExamAttempt.exists({ examId });
    if (hasAttempts) {
      return res.status(400).json({ 
        message: 'Cannot delete exam because it has already been attempted by students' 
      });
    }

    // Delete the exam
    await Exam.findByIdAndDelete(examId);

    return res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error in deleteExam:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start an exam
exports.startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

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
    const now = new Date();
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

    // Check if user has already completed this exam
    const existingAttempt = await ExamAttempt.findOne({
      userId,
      examId,
    }).populate('examId');

    // If attempt exists and is submitted, don't allow retake
    if (existingAttempt && ['submitted', 'graded', 'timed-out'].includes(existingAttempt.status)) {
      // Get the attempt details to provide more helpful information
      const attemptDetails = await ExamAttempt.findById(existingAttempt._id)
        .select('totalMarksAwarded percentage submittedAt status');
      
      return res.status(200).json({
        success: false,
        message: 'You have already completed this exam',
        errorCode: 'ALREADY_COMPLETED',
        attemptDetails: {
          _id: existingAttempt._id,
          status: existingAttempt.status,
          submittedAt: existingAttempt.submittedAt,
          totalMarksAwarded: attemptDetails?.totalMarksAwarded,
          percentage: attemptDetails?.percentage,
          redirectUrl: `/exams/result/${existingAttempt._id}`
        }
      });
    }

    // If attempt exists and is in progress, return that attempt
    if (existingAttempt && existingAttempt.status === 'in-progress') {
      // Calculate remaining time
      const elapsedSeconds = Math.floor((now - existingAttempt.startTime) / 1000);
      const initialSeconds = exam.duration * 60; // Convert minutes to seconds
      const remainingSeconds = Math.max(0, initialSeconds - elapsedSeconds);
      
      // Update timeRemaining field
      existingAttempt.timeRemaining = remainingSeconds;
      await existingAttempt.save();

      // If time has expired, auto-submit the attempt
      if (remainingSeconds <= 0) {
        existingAttempt.status = 'timed-out';
        existingAttempt.submittedAt = now;
        await existingAttempt.save();
        
        return res.status(403).json({
          success: false,
          message: 'Your time for this exam has expired',
          errorCode: 'TIME_EXPIRED'
        });
      }

      // Fetch exam with questions
      const fullExam = await Exam.findById(examId);

      return res.status(200).json({
        success: true,
        message: 'Continuing exam attempt',
        attempt: {
          _id: existingAttempt._id,
          startTime: existingAttempt.startTime,
          timeRemaining: remainingSeconds,
          status: existingAttempt.status,
          sections: existingAttempt.sections
        },
        exam: {
          _id: fullExam._id,
          title: fullExam.title,
          duration: fullExam.duration,
          totalMarks: fullExam.totalMarks,
          sections: fullExam.sections,
          endTime: fullExam.endTime
        }
      });
    }

    // Create a new attempt
    const newAttempt = new ExamAttempt({
      userId,
      examId,
      startTime: now,
      status: 'in-progress',
      timeRemaining: exam.duration * 60, // Convert minutes to seconds
      sections: exam.sections.map(section => ({
        sectionId: section._id,
        answers: section.questions.map(question => ({
          questionId: question._id,
          answer: '',
          selectedOption: null,
          isGraded: false,
          marksAwarded: 0
        }))
      }))
    });

    await newAttempt.save();

    // Fetch exam with questions
    const fullExam = await Exam.findById(examId);

    return res.status(201).json({
      success: true,
      message: 'Exam attempt started',
      attempt: {
        _id: newAttempt._id,
        startTime: newAttempt.startTime,
        timeRemaining: newAttempt.timeRemaining,
        status: newAttempt.status,
        sections: newAttempt.sections
      },
      exam: {
        _id: fullExam._id,
        title: fullExam.title,
        duration: fullExam.duration,
        totalMarks: fullExam.totalMarks,
        sections: fullExam.sections,
        endTime: fullExam.endTime
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

// Save exam progress
exports.saveExamProgress = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, timeRemaining } = req.body;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    // Verify this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this attempt' });
    }

    // Check if attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'This exam attempt has already been submitted' });
    }

    // Update answers
    if (answers) {
      for (const sectionId in answers) {
        const sectionIndex = attempt.sections.findIndex(
          section => section.sectionId.toString() === sectionId
        );
        
        if (sectionIndex >= 0) {
          for (const questionId in answers[sectionId]) {
            const answerIndex = attempt.sections[sectionIndex].answers.findIndex(
              answer => answer.questionId.toString() === questionId
            );
            
            if (answerIndex >= 0) {
              const answer = answers[sectionId][questionId];
              
              // Update the answer based on what was provided
              if (answer.answer !== undefined) {
                attempt.sections[sectionIndex].answers[answerIndex].answer = answer.answer;
              }
              
              if (answer.selectedOption !== undefined) {
                attempt.sections[sectionIndex].answers[answerIndex].selectedOption = answer.selectedOption;
              }
              
              // File uploads are handled separately
            }
          }
        }
      }
    }

    // Update time remaining
    if (timeRemaining !== undefined) {
      attempt.timeRemaining = timeRemaining;
    }

    await attempt.save();

    return res.status(200).json({
      message: 'Exam progress saved successfully',
      attempt
    });
  } catch (error) {
    console.error('Error in saveExamProgress:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload a file for a file type question
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { attemptId, sectionId, questionId } = req.params;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    // Verify this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this attempt' });
    }

    // Check if attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'This exam attempt has already been submitted' });
    }

    // Find the section and question
    const sectionIndex = attempt.sections.findIndex(
      section => section.sectionId.toString() === sectionId
    );
    
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found in this attempt' });
    }
    
    const answerIndex = attempt.sections[sectionIndex].answers.findIndex(
      answer => answer.questionId.toString() === questionId
    );
    
    if (answerIndex === -1) {
      return res.status(404).json({ message: 'Question not found in this section' });
    }

    // Get the question from the exam to verify it's a file question
    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const examSection = exam.sections.find(s => s._id.toString() === sectionId);
    if (!examSection) {
      return res.status(404).json({ message: 'Section not found in exam' });
    }

    const question = examSection.questions.find(q => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found in exam' });
    }

    // Check if it's a file or fileUpload type question
    if (question.type !== 'file' && question.type !== 'fileUpload') {
      return res.status(400).json({ message: 'Question does not accept file uploads' });
    }

    // Update file path
    const filePath = req.file.path;
    attempt.sections[sectionIndex].answers[answerIndex].filePath = filePath;
    attempt.sections[sectionIndex].answers[answerIndex].answer = req.file.originalname;

    await attempt.save();

    return res.status(200).json({
      message: 'File uploaded successfully',
      filePath
    });
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit an exam attempt
exports.submitExam = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    // Verify this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to submit this attempt' });
    }

    // Check if attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'This exam attempt has already been submitted' });
    }

    // Get the exam to check questions
    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Auto-grade MCQ questions
    let totalMarksAwarded = 0;
    
    for (let sectionIndex = 0; sectionIndex < attempt.sections.length; sectionIndex++) {
      const section = attempt.sections[sectionIndex];
      const examSection = exam.sections.find(s => s._id.toString() === section.sectionId.toString());
      
      if (!examSection) continue;
      
      let sectionMarksAwarded = 0;
      
      for (let answerIndex = 0; answerIndex < section.answers.length; answerIndex++) {
        const answer = section.answers[answerIndex];
        const question = examSection.questions.find(q => q._id.toString() === answer.questionId.toString());
        
        if (!question) continue;
        
        // Auto-grade MCQs
        if (question.type === 'mcq' && answer.selectedOption !== null) {
          const isCorrect = question.options[answer.selectedOption]?.isCorrect || false;
          
          if (isCorrect) {
            answer.marksAwarded = question.marks;
            answer.isGraded = true;
            sectionMarksAwarded += question.marks;
          } else {
            answer.marksAwarded = 0;
            answer.isGraded = true;
          }
        }
      }
      
      section.totalMarksAwarded = sectionMarksAwarded;
      totalMarksAwarded += sectionMarksAwarded;
    }

    // Update attempt status
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.totalMarksAwarded = totalMarksAwarded;
    attempt.isGraded = false; // Will be set to true when all questions are graded
    
    // Calculate percentage for MCQs
    const mcqTotalMarks = exam.sections.reduce((total, section) => {
      return total + section.questions.filter(q => q.type === 'mcq').reduce((sectionTotal, q) => sectionTotal + q.marks, 0);
    }, 0);
    
    if (mcqTotalMarks > 0) {
      attempt.percentage = (totalMarksAwarded / exam.totalMarks) * 100;
    } else {
      attempt.percentage = 0; // Will be updated when all questions are graded
    }

    await attempt.save();

    return res.status(200).json({
      message: 'Exam submitted successfully',
      attempt
    });
  } catch (error) {
    console.error('Error in submitExam:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

// Update time remaining for an attempt
exports.updateTimeRemaining = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { timeRemaining } = req.body;
    const userId = req.user.id;

    // Find attempt
    const attempt = await ExamAttempt.findById(attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    // Verify this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this attempt' });
    }

    // Check if attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'This exam attempt has already been submitted' });
    }

    // Update time remaining
    attempt.timeRemaining = timeRemaining;
    
    // If time is up, auto-submit
    if (timeRemaining <= 0) {
      // Mark as timed out
      attempt.status = 'timed-out';
      attempt.submittedAt = new Date();
      
      // Get the exam to auto-grade MCQ questions
      try {
        const exam = await Exam.findById(attempt.examId);
        if (exam) {
          let totalMarksAwarded = 0;
          
          for (let sectionIndex = 0; sectionIndex < attempt.sections.length; sectionIndex++) {
            const section = attempt.sections[sectionIndex];
            const examSection = exam.sections.find(s => s._id.toString() === section.sectionId.toString());
            
            if (!examSection) continue;
            
            let sectionMarksAwarded = 0;
            
            for (let answerIndex = 0; answerIndex < section.answers.length; answerIndex++) {
              const answer = section.answers[answerIndex];
              const question = examSection.questions.find(q => q._id.toString() === answer.questionId.toString());
              
              if (!question) continue;
              
              // Auto-grade MCQs
              if (question.type === 'mcq' && answer.selectedOption !== null) {
                const isCorrect = question.options[answer.selectedOption]?.isCorrect || false;
                
                if (isCorrect) {
                  answer.marksAwarded = question.marks;
                  answer.isGraded = true;
                  sectionMarksAwarded += question.marks;
                } else {
                  answer.marksAwarded = 0;
                  answer.isGraded = true;
                }
              }
            }
            
            section.totalMarksAwarded = sectionMarksAwarded;
            totalMarksAwarded += sectionMarksAwarded;
          }
          
          // Update total marks
          attempt.totalMarksAwarded = totalMarksAwarded;
          
          // Calculate percentage for MCQs
          if (exam.totalMarks > 0) {
            attempt.percentage = (totalMarksAwarded / exam.totalMarks) * 100;
          }
        }
      } catch (error) {
        console.error('Error auto-grading MCQs on time expiry:', error);
        // Continue with saving attempt even if auto-grading fails
      }
    }

    await attempt.save();

    return res.status(200).json({
      message: 'Time remaining updated successfully',
      attempt
    });
  } catch (error) {
    console.error('Error in updateTimeRemaining:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update exam publish status
exports.updatePublishStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const { isPublished } = req.body;
    const userId = req.user.id;

    // Find exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user is authorized to update this exam
    if (exam.createdBy.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to update this exam' });
    }

    // Update publish status
    exam.isPublished = isPublished;
    await exam.save();

    return res.status(200).json({
      message: `Exam ${isPublished ? 'published' : 'unpublished'} successfully`,
      exam
    });
  } catch (error) {
    console.error('Error in updatePublishStatus:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all exams for a user's enrolled courses
exports.getUserExams = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Get user's enrollments
    const enrollments = await Enrollment.find({ userId });
    const courseIds = enrollments.map(e => e.courseId);
    
    // Get current date
    const now = new Date();
    
    // Get all exams for these courses
    const allExams = await Exam.find({ 
      courseId: { $in: courseIds },
      isPublished: true
    })
    .populate('courseId', 'title') // Just get the course title
    .select('title description courseId duration startTime endTime totalMarks'); // Select only needed fields
    
    // Get all attempts by this user
    const attempts = await ExamAttempt.find({ 
      userId,
      examId: { $in: allExams.map(exam => exam._id) }
    })
    .select('examId status startTime submittedAt timeRemaining');
    
    // Function to categorize exams
    const categorizeExams = (exams, attempts) => {
      const upcoming = [];
      const live = [];
      const completed = [];
      
      // Get current date in UTC to match the stored dates format
      const now = new Date();
      
      exams.forEach(exam => {
        const examObj = exam.toObject();
        // Create new Date objects in a consistent format
        const startTime = new Date(exam.startTime);
        const endTime = new Date(exam.endTime);
        
        // Find if user has an attempt for this exam
        const attempt = attempts.find(a => a.examId.toString() === exam._id.toString());
        
        // Add attempt information
        examObj.studentStartedExam = !!attempt;
        examObj.studentSubmitted = attempt ? 
          ['submitted', 'graded', 'timed-out'].includes(attempt.status) : false;
        examObj.attemptId = attempt ? attempt._id : null;
        examObj.timeRemaining = attempt ? attempt.timeRemaining : exam.duration * 60; // Convert duration to seconds
        
        // Convert dates to ISO strings for consistent handling
        examObj.startTime = startTime.toISOString();
        examObj.endTime = endTime.toISOString();
        
        // Check if the attempt's time has expired but status hasn't been updated
        const timeExpired = attempt && 
                           attempt.status === 'in-progress' && 
                           attempt.timeRemaining <= 0;
                           
        // Check if the exam's end time has passed
        const examEnded = endTime < now;
        
        // Categorize the exam
        // If the student has submitted the exam or time expired, always put it in completed
        if (examObj.studentSubmitted || timeExpired || examEnded) {
          examObj.status = examObj.studentSubmitted ? 'completed' : 
                          timeExpired ? 'time-expired' : 'ended';
          completed.push(examObj);
          
          // If the attempt is in progress but time expired, update its status
          if (attempt && timeExpired && attempt.status === 'in-progress') {
            // Update the attempt status asynchronously
            ExamAttempt.findByIdAndUpdate(
              attempt._id,
              { 
                status: 'timed-out',
                submittedAt: new Date()
              },
              { new: true }
            ).catch(err => console.error('Error updating expired attempt:', err));
          }
        } 
        else if (startTime <= now && endTime >= now) {
          examObj.status = 'live';
          live.push(examObj);
        } else {
          examObj.status = 'upcoming';
          upcoming.push(examObj);
        }
      });
      
      return { upcoming, live, completed };
    };
    
    const categorizedExams = categorizeExams(allExams, attempts);
    
    return res.status(200).json({
      success: true,
      data: categorizedExams
    });
  } catch (error) {
    console.error('Error in getUserExams:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching exams',
      error: error.message
    });
  }
}; 