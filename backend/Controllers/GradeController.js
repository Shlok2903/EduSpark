const Grade = require('../Models/Grade');
const ExamAttempt = require('../Models/ExamAttempt');
const mongoose = require('mongoose');

// Create grade from exam attempt
exports.createGradeFromExamAttempt = async (req, res) => {
  try {
    const { attemptId, gradedBy } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ message: 'Invalid attempt ID format' });
    }
    
    // Find the exam attempt
    const examAttempt = await ExamAttempt.findById(attemptId)
      .populate('examId');
    
    if (!examAttempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }
    
    if (examAttempt.status !== 'submitted' && examAttempt.status !== 'timed-out') {
      return res.status(400).json({ message: 'Cannot grade an exam that is not submitted or timed-out' });
    }
    
    // Check if a grade already exists
    const existingGrade = await Grade.findOne({ 
      attemptId: examAttempt._id,
      attemptType: 'examAttempts'
    });
    
    if (existingGrade) {
      return res.status(400).json({ message: 'Grade already exists for this attempt' });
    }
    
    // Create the grade sections and questions from the attempt
    const sections = examAttempt.sections.map(section => {
      const questions = section.answers.map(answer => {
        return {
          questionId: answer.questionId,
          marksAwarded: answer.marksAwarded || 0,
          maxMarks: answer.maxMarks || 0, // This should be populated from the exam question
          feedback: answer.feedback || ''
        };
      });
      
      return {
        sectionId: section.sectionId,
        sectionName: section.sectionName || '',
        questions: questions,
        maxSectionMarks: section.maxMarks || 0 // This should be populated from the exam section
      };
    });
    
    // Determine pass/fail status based on percentage
    // This assumes there's a passing threshold defined in the exam
    const passingPercentage = examAttempt.examId.passingPercentage || 40; // Default to 40% if not specified
    const percentage = (examAttempt.totalMarksAwarded / examAttempt.examId.totalMarks) * 100;
    const status = percentage >= passingPercentage ? 'pass' : 'fail';
    
    // Create new grade
    const newGrade = new Grade({
      userId: examAttempt.userId,
      type: 'exam',
      contentId: examAttempt.examId._id,
      contentType: 'exams',
      sections: sections,
      totalMarksAwarded: examAttempt.totalMarksAwarded,
      maxMarks: examAttempt.examId.totalMarks,
      percentage: percentage,
      status: status,
      gradedBy: gradedBy,
      attemptId: examAttempt._id,
      attemptType: 'examAttempts'
    });
    
    // Save the grade
    await newGrade.save();
    
    // Update exam attempt status to 'graded'
    examAttempt.status = 'graded';
    examAttempt.isGraded = true;
    await examAttempt.save();
    
    return res.status(201).json({
      message: 'Grade created successfully',
      grade: newGrade
    });
    
  } catch (error) {
    console.error('Error creating grade:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all grades
exports.getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.find()
      .populate('userId', 'name email')
      .populate('gradedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get grades by user ID
exports.getGradesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const grades = await Grade.find({ userId })
      .populate('contentId')
      .populate('gradedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching user grades:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get grade by ID
exports.getGradeById = async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(gradeId)) {
      return res.status(400).json({ message: 'Invalid grade ID format' });
    }
    
    const grade = await Grade.findById(gradeId)
      .populate('userId', 'name email')
      .populate('contentId')
      .populate('gradedBy', 'name email');
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    return res.status(200).json(grade);
  } catch (error) {
    console.error('Error fetching grade:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update grade
exports.updateGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const updates = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(gradeId)) {
      return res.status(400).json({ message: 'Invalid grade ID format' });
    }
    
    const updatedGrade = await Grade.findByIdAndUpdate(gradeId, updates, { new: true });
    
    if (!updatedGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    return res.status(200).json({
      message: 'Grade updated successfully',
      grade: updatedGrade
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 