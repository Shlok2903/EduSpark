const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Answer Schema (unified for all question types)
const AnswerSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  // For MCQ: selectedOption is the index of selected answer
  selectedOption: {
    type: Number,
    default: null
  },
  // For subjective questions: answer contains text
  answer: {
    type: String,
    default: ""
  },
  // For file upload questions
  filePath: {
    type: String,
    default: null
  },
  fileName: String,
  // Grading fields
  isGraded: {
    type: Boolean,
    default: false
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  feedback: String
});

// Section Attempt Schema
const SectionAttemptSchema = new Schema({
  sectionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  answers: [AnswerSchema],
  totalMarksAwarded: {
    type: Number,
    default: 0
  }
});

// Exam Attempt Schema
const ExamAttemptSchema = new Schema({
  examId: {
    type: Schema.Types.ObjectId,
    ref: 'exams',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  completedTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'timed-out', 'graded'],
    default: 'in-progress'
  },
  timeRemaining: {
    type: Number, // in seconds
    default: 0
  },
  sections: [SectionAttemptSchema],
  totalMarksAwarded: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  isGraded: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to calculate total marks awarded
ExamAttemptSchema.pre('save', function(next) {
  if (this.isModified('sections')) {
    let totalMarksAwarded = 0;
    
    this.sections.forEach(section => {
      let sectionMarks = 0;
      
      // Add up marks from all answers
      section.answers.forEach(answer => {
        sectionMarks += answer.marksAwarded || 0;
      });
      
      section.totalMarksAwarded = sectionMarks;
      totalMarksAwarded += sectionMarks;
    });
    
    this.totalMarksAwarded = totalMarksAwarded;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Method to check if all questions are graded
ExamAttemptSchema.methods.checkIfFullyGraded = function() {
  let isFullyGraded = true;
  
  for (const section of this.sections) {
    for (const answer of section.answers) {
      if (!answer.isGraded) {
        isFullyGraded = false;
        break;
      }
    }
    
    if (!isFullyGraded) break;
  }
  
  return isFullyGraded;
};

const ExamAttemptModel = mongoose.model('examAttempts', ExamAttemptSchema);
module.exports = ExamAttemptModel; 