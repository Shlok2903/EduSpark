const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Answer Schema for quiz questions
const QuizAnswerSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  selectedOption: {
    type: Number,  // Index of the selected option for MCQs
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  marksAwarded: {
    type: Number,
    default: 0
  }
});

// Quiz Attempt Schema
const QuizAttemptSchema = new Schema({
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: 'modules',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'courses',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: {
    type: Number, // in minutes
    default: 0
  },
  timeRemaining: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'timed-out'],
    default: 'in-progress'
  },
  answers: [QuizAnswerSchema],
  totalMarks: {
    type: Number,
    default: 0
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  submittedAt: Date
});

// Pre-save hook to calculate total marks awarded and percentage
QuizAttemptSchema.pre('save', function(next) {
  if (this.isModified('answers')) {
    let totalMarksAwarded = 0;
    
    this.answers.forEach(answer => {
      totalMarksAwarded += answer.marksAwarded || 0;
    });
    
    this.marksAwarded = totalMarksAwarded;
    
    if (this.totalMarks > 0) {
      this.percentage = (totalMarksAwarded / this.totalMarks) * 100;
    }
  }
  
  next();
});

const QuizAttemptModel = mongoose.model('quizAttempts', QuizAttemptSchema);
module.exports = QuizAttemptModel; 