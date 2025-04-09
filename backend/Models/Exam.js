const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Question Schema
const QuestionSchema = new Schema({
  type: {
    type: String,
    enum: ['mcq', 'subjective', 'file'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  marks: {
    type: Number,
    required: true,
    default: 1
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'image', 'code', 'any'],
    default: 'any'
  }
});

// Section Schema
const SectionSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  questions: [QuestionSchema],
  totalMarks: {
    type: Number,
    default: 0
  }
});

// Exam Schema
const ExamSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'courses',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  sections: [SectionSchema],
  totalMarks: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Pre-save hook to calculate total marks
ExamSchema.pre('save', function(next) {
  let totalMarks = 0;
  
  // Calculate total marks for each section
  this.sections.forEach(section => {
    let sectionMarks = 0;
    section.questions.forEach(question => {
      sectionMarks += question.marks;
    });
    section.totalMarks = sectionMarks;
    totalMarks += sectionMarks;
  });
  
  this.totalMarks = totalMarks;
  this.updatedAt = Date.now();
  next();
});

const ExamModel = mongoose.model('exams', ExamSchema);
module.exports = ExamModel; 