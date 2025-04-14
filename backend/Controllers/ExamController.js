const { Exam, ExamAttempt, Course, User } = require('../Models');
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

    // Create new exam
    const newExam = new Exam({
      title,
      description,
      courseId,
      createdBy: userId,
      sections: sections || [],
      duration,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
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

    return res.status(200).json({
      exam,
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

// Start an exam attempt for a student
exports.startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;
    
    console.log(`Starting exam attempt for exam: ${examId}, user: ${userId}`);

    // Find exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      console.log(`Exam not found: ${examId}`);
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    console.log(`Found exam: ${exam.title}`);

    // Check if exam is published
    if (!exam.isPublished) {
      console.log(`Exam ${examId} is not published`);
      return res.status(400).json({ message: 'This exam is not yet available', errorCode: 'NOT_PUBLISHED' });
    }

    // Check exam time constraints
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}, Exam start: ${exam.startTime}, Exam end: ${exam.endTime}`);
    
    if (now < new Date(exam.startTime)) {
      console.log(`Exam ${examId} has not started yet`);
      return res.status(400).json({ 
        message: 'This exam has not started yet', 
        errorCode: 'NOT_STARTED',
        startTime: exam.startTime
      });
    }
    
    if (now > new Date(exam.endTime)) {
      console.log(`Exam ${examId} has already ended`);
      return res.status(400).json({ 
        message: 'This exam has already ended',
        errorCode: 'ALREADY_ENDED', 
        endTime: exam.endTime
      });
    }

    // Check if student already has an attempt
    const existingAttempt = await ExamAttempt.findOne({
      userId,
      examId
    });

    if (existingAttempt) {
      console.log(`Found existing attempt ${existingAttempt._id} with status ${existingAttempt.status}`);
      
      // If there's an existing attempt in progress, return it
      if (existingAttempt.status === 'in-progress') {
        return res.status(200).json({
          message: 'Resuming existing exam attempt',
          attempt: existingAttempt
        });
      }
      
      // If the attempt is already submitted or timed out
      if (['submitted', 'timed-out', 'graded'].includes(existingAttempt.status)) {
        console.log(`Attempt ${existingAttempt._id} already completed with status ${existingAttempt.status}`);
        return res.status(400).json({ 
          message: 'You have already completed this exam',
          errorCode: 'ALREADY_COMPLETED',
          attemptId: existingAttempt._id
        });
      }
    }

    // Create sections for the attempt
    const sections = exam.sections.map(section => ({
      sectionId: section._id,
      answers: section.questions.map(question => ({
        questionId: question._id,
        answer: null,
        selectedOption: null,
        filePath: null,
        isGraded: false
      })),
      isCompleted: false
    }));

    // Create new attempt
    const newAttempt = new ExamAttempt({
      examId,
      userId,
      courseId: exam.courseId,
      duration: exam.duration,
      timeRemaining: exam.duration * 60, // Convert to seconds
      status: 'in-progress',
      sections,
      totalMarks: exam.totalMarks
    });

    await newAttempt.save();
    console.log(`Created new attempt ${newAttempt._id}`);

    return res.status(201).json({
      message: 'Exam attempt started successfully',
      attempt: newAttempt
    });
  } catch (error) {
    console.error('Error in startExam:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
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

    // Update file path
    const filePath = req.file.path;
    attempt.sections[sectionIndex].answers[answerIndex].filePath = filePath;

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
      // Logic similar to submitExam but with timed-out status
      attempt.status = 'timed-out';
      attempt.submittedAt = new Date();
      
      // We could add auto-grading logic here as well for MCQs
      // But for simplicity, let's just update the status for now
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