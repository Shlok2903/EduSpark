const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Answer Schema
const AnswerSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  answer: {
    type: Schema.Types.Mixed, // Can be string for text, number for mcq index, or file path for file uploads
    default: null
  },
  selectedOption: {
    type: Number,  // Index of the selected option for MCQs
    default: null
  },
  filePath: {
    type: String,  // Path to uploaded file for file type questions
    default: null
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  feedback: String,
  isGraded: {
    type: Boolean,
    default: false
  }
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
  },
  isCompleted: {
    type: Boolean,
    default: false
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
    type: Number, // in minutes, copied from exam
    required: true
  },
  timeRemaining: {
    type: Number, // in seconds
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'timed-out', 'graded'],
    default: 'in-progress'
  },
  sections: [SectionAttemptSchema],
  totalMarks: {
    type: Number,
    default: 0
  },
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
  submittedAt: Date,
  lastUpdated: {
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
      section.answers.forEach(answer => {
        sectionMarks += answer.marksAwarded || 0;
      });
      section.totalMarksAwarded = sectionMarks;
      totalMarksAwarded += sectionMarks;
    });
    
    this.totalMarksAwarded = totalMarksAwarded;
    
    if (this.totalMarks > 0) {
      this.percentage = (totalMarksAwarded / this.totalMarks) * 100;
    }
  }
  
  this.lastUpdated = Date.now();
  next();
});

const ExamAttemptModel = mongoose.model('examAttempts', ExamAttemptSchema);
module.exports = ExamAttemptModel; 