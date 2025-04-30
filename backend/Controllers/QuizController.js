// Import models directly
const Module = require('../Models/Module');
const Course = require('../Models/Course');
const QuizAttempt = require('../Models/QuizAttempt');
const User = require('../Models/User');
const mongoose = require('mongoose');

// Get quiz metadata without questions
exports.getQuizInfo = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    // Find the module
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Validate it's a quiz module
    if (module.contentType !== 'quizz' && module.contentType !== 'quiz') {
      return res.status(400).json({ message: 'This module is not a quiz' });
    }

    // Extract only the necessary quiz metadata
    const quizContent = module.quizContent || module.content?.quiz;
    const quizInfo = {
      totalQuestions: quizContent?.questions?.length || 0,
      totalMarks: quizContent?.totalMarks || quizContent?.questions?.length || 0,
      passingScore: quizContent?.passingScore || 70,
      timer: quizContent?.timer || 0,
      maxAttempts: quizContent?.maxAttempts || 0,
      deadline: quizContent?.deadline || null
    };

    // Get previous attempts count
    const attemptCount = await QuizAttempt.countDocuments({
      moduleId,
      userId,
      status: { $in: ['completed', 'timed-out'] }
    });

    return res.status(200).json({
      moduleId,
      quizInfo,
      previousAttempts: attemptCount,
      isDeadlinePassed: quizInfo.deadline ? new Date() > new Date(quizInfo.deadline) : false,
      maxAttemptsReached: quizInfo.maxAttempts > 0 && attemptCount >= quizInfo.maxAttempts
    });
  } catch (error) {
    console.error('Error in getQuizInfo:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Modify the startQuiz function to avoid returning full questions
exports.startQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    // Find the module
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Validate it's a quiz module
    if (module.contentType !== 'quizz' && module.contentType !== 'quiz') {
      return res.status(400).json({ message: 'This module is not a quiz' });
    }

    // Check if there's a deadline and if it has passed
    if (module.quizContent?.deadline && new Date() > new Date(module.quizContent.deadline)) {
      return res.status(400).json({ 
        message: 'The deadline for this quiz has passed',
        errorCode: 'DEADLINE_PASSED'
      });
    }

    // Check for max attempts
    if (module.quizContent?.maxAttempts > 0) {
      const attemptCount = await QuizAttempt.countDocuments({
        moduleId,
        userId,
        status: { $in: ['completed', 'timed-out'] }
      });

      if (attemptCount >= module.quizContent.maxAttempts) {
        return res.status(400).json({
          message: `You have reached the maximum number of attempts (${module.quizContent.maxAttempts})`,
          errorCode: 'MAX_ATTEMPTS_REACHED'
        });
      }
    }

    // Check if there's an existing in-progress attempt
    const existingAttempt = await QuizAttempt.findOne({
      moduleId,
      userId,
      status: 'in-progress'
    });

    if (existingAttempt) {
      // Update the remaining time based on the startTime
      if (existingAttempt.startTime && existingAttempt.duration > 0) {
        const now = new Date();
        const elapsedSeconds = Math.floor((now - existingAttempt.startTime) / 1000);
        const totalSeconds = existingAttempt.duration * 60; // Convert minutes to seconds
        existingAttempt.timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
        await existingAttempt.save();
      }

      // Return minimal information about the attempt
      return res.status(200).json({
        message: 'Resuming existing quiz attempt',
        attempt: {
          _id: existingAttempt._id,
          moduleId: existingAttempt.moduleId,
          status: existingAttempt.status,
          timeRemaining: existingAttempt.timeRemaining,
          questionIds: existingAttempt.answers.map(a => a.questionId),
          totalQuestions: existingAttempt.answers.length
        }
      });
    }

    // Get the number of previous attempts
    const attemptNumber = await QuizAttempt.countDocuments({
      moduleId,
      userId
    }) + 1;

    // Create answer objects for each question, but don't include the full questions
    const quizQuestions = module.quizContent?.questions || module.content?.quiz?.questions || [];
    
    // Calculate timer duration - either use module setting or calculate 2 minutes per question
    let quizDuration = module.quizContent?.timer || 0;
    if (quizDuration === 0 && quizQuestions.length > 0) {
      // Default to 2 minutes per question if no timer is set
      quizDuration = quizQuestions.length * 2;
    }
    
    // Create a new quiz attempt
    const newAttempt = new QuizAttempt({
      moduleId,
      userId,
      courseId: module.courseId,
      startTime: new Date(), // Set the start time explicitly
      duration: quizDuration,
      timeRemaining: quizDuration * 60, // Convert to seconds
      status: 'in-progress',
      answers: quizQuestions.map(question => ({
        questionId: question._id,
        selectedOption: null,
        isCorrect: false,
        marksAwarded: 0
      })),
      totalMarks: module.quizContent?.totalMarks || quizQuestions.length,
      attemptNumber
    });

    await newAttempt.save();

    // Return minimal information to start the quiz
    return res.status(201).json({
      message: 'Quiz attempt started successfully',
      attempt: {
        _id: newAttempt._id,
        moduleId: newAttempt.moduleId,
        status: newAttempt.status,
        timeRemaining: newAttempt.timeRemaining,
        questionIds: newAttempt.answers.map(a => a.questionId),
        totalQuestions: newAttempt.answers.length
      }
    });
  } catch (error) {
    console.error('Error in startQuiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save quiz progress
exports.saveQuizProgress = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, timeRemaining } = req.body;
    const userId = req.user.id;

    // Find the attempt
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    // Ensure this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this attempt' });
    }

    // Ensure the attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'This quiz attempt has already been submitted' });
    }

    // Update answers if provided
    if (answers) {
      Object.keys(answers).forEach(questionId => {
        const answerIndex = attempt.answers.findIndex(
          a => a.questionId.toString() === questionId
        );

        if (answerIndex >= 0) {
          attempt.answers[answerIndex].selectedOption = answers[questionId];
        }
      });
    }

    // Update time remaining if provided
    if (timeRemaining !== undefined) {
      attempt.timeRemaining = timeRemaining;
    }

    await attempt.save();

    return res.status(200).json({
      message: 'Quiz progress saved successfully',
      attempt
    });
  } catch (error) {
    console.error('Error in saveQuizProgress:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit quiz
exports.submitQuiz = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Find the attempt
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    // Ensure this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to submit this attempt' });
    }

    // Ensure the attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'This quiz attempt has already been submitted' });
    }

    // Find the module to get the questions
    const module = await Module.findById(attempt.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Grade the answers
    let totalCorrect = 0;
    let totalMarksAwarded = 0;

    attempt.answers.forEach(answer => {
      const question = module.quizContent.questions.id(answer.questionId);
      
      if (question && answer.selectedOption !== null) {
        const correctOptionIndex = question.options.findIndex(opt => opt.isCorrect);
        const isCorrect = answer.selectedOption === correctOptionIndex;
        
        answer.isCorrect = isCorrect;
        answer.marksAwarded = isCorrect ? (question.marks || 1) : 0;

        if (isCorrect) {
          totalCorrect++;
          totalMarksAwarded += question.marks || 1;
        }
      }
    });

    // Update the attempt
    attempt.status = 'completed';
    attempt.submittedAt = new Date();
    attempt.endTime = new Date();
    attempt.marksAwarded = totalMarksAwarded;
    attempt.percentage = (totalMarksAwarded / attempt.totalMarks) * 100;
    attempt.isPassed = attempt.percentage >= module.quizContent.passingScore;

    await attempt.save();

    // Return the graded attempt
    return res.status(200).json({
      message: 'Quiz submitted successfully',
      attempt: {
        ...attempt.toObject(),
        totalCorrect,
        totalQuestions: module.quizContent.questions.length,
        passingScore: module.quizContent.passingScore
      }
    });
  } catch (error) {
    console.error('Error in submitQuiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update time remaining
exports.updateTimeRemaining = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { timeRemaining } = req.body;
    const userId = req.user.id;

    // Find the attempt
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    // Ensure this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this attempt' });
    }

    // Ensure the attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'This quiz attempt has already been submitted' });
    }

    // Update time remaining
    attempt.timeRemaining = timeRemaining;
    
    // If time is up, auto-submit
    if (timeRemaining <= 0) {
      attempt.status = 'timed-out';
      attempt.submittedAt = new Date();
      attempt.endTime = new Date();
      
      // Auto-grade the answers
      const module = await Module.findById(attempt.moduleId);
      
      if (module) {
        let totalMarksAwarded = 0;
        
        attempt.answers.forEach(answer => {
          const question = module.quizContent.questions.id(answer.questionId);
          
          if (question && answer.selectedOption !== null) {
            const correctOptionIndex = question.options.findIndex(opt => opt.isCorrect);
            const isCorrect = answer.selectedOption === correctOptionIndex;
            
            answer.isCorrect = isCorrect;
            answer.marksAwarded = isCorrect ? (question.marks || 1) : 0;
            
            if (isCorrect) {
              totalMarksAwarded += question.marks || 1;
            }
          }
        });
        
        attempt.marksAwarded = totalMarksAwarded;
        attempt.percentage = (totalMarksAwarded / attempt.totalMarks) * 100;
        attempt.isPassed = attempt.percentage >= module.quizContent.passingScore;
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

// Get quiz attempts by module
exports.getQuizAttemptsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    // Find all attempts for this module and user
    const attempts = await QuizAttempt.find({
      moduleId,
      userId
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      attempts
    });
  } catch (error) {
    console.error('Error in getQuizAttemptsByModule:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get quiz attempt by ID
exports.getQuizAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Find the attempt
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    // Ensure this attempt belongs to the user unless admin
    if (attempt.userId.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to view this attempt' });
    }

    // Get the module for additional context
    const module = await Module.findById(attempt.moduleId);

    return res.status(200).json({
      attempt,
      module: module ? {
        title: module.title,
        passingScore: module.quizContent?.passingScore,
        totalQuestions: module.quizContent?.questions?.length
      } : null
    });
  } catch (error) {
    console.error('Error in getQuizAttemptById:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a function to get quiz questions
exports.getQuizQuestions = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Find the attempt
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    // Ensure this attempt belongs to the user
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to view this attempt' });
    }

    // Ensure the attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'This quiz attempt has already been submitted' });
    }

    // Find the module to get the questions
    const module = await Module.findById(attempt.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Get questions from the module
    const quizQuestions = module.quizContent?.questions || module.content?.quiz?.questions || [];
    
    // Map questions to return only necessary information
    const questions = quizQuestions.map(question => ({
      _id: question._id,
      question: question.question,
      options: question.options.map(opt => {
        if (typeof opt === 'string') {
          return opt;
        } else if (opt && typeof opt === 'object') {
          return opt.text || '';
        }
        return '';
      }),
      marks: question.marks || 1
    }));

    // If there's a time limit and startTime is set, calculate the remaining time
    let timeRemaining = attempt.timeRemaining;
    if (attempt.startTime && attempt.duration > 0) {
      const now = new Date();
      const elapsedSeconds = Math.floor((now - attempt.startTime) / 1000);
      const totalSeconds = attempt.duration * 60; // Convert duration from minutes to seconds
      timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
      
      // Update the attempt with the calculated time remaining
      attempt.timeRemaining = timeRemaining;
      await attempt.save();
    }

    return res.status(200).json({
      questions,
      timeRemaining
    });
  } catch (error) {
    console.error('Error in getQuizQuestions:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 