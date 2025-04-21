const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Question Schema - Options for MCQ
const OptionSchema = new Schema({
  text: {
    type: String,
    required: true
  }
});

// Question Schema
const QuestionSchema = new Schema({
  type: {
    type: String,
    enum: ['mcq', 'subjective', 'fileUpload'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  // MCQ specific fields
  options: {
    type: [OptionSchema],
    required: function() { return this.type === 'mcq'; }
  },
  correct_option: {
    type: Number,  // Index of the correct option
    min: 0,
    required: function() { return this.type === 'mcq'; }
  },
  positiveMarks: {
    type: Number,
    required: function() { return this.type === 'mcq'; },
    default: 1
  },
  negativeMarks: {
    type: Number,
    default: 0
  },
  // Subjective and FileUpload fields
  marks: {
    type: Number,
    required: function() { return this.type === 'subjective' || this.type === 'fileUpload'; },
    default: 0
  },
  desc: {
    type: String  // Optional description for subjective and fileUpload
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'zip', 'image', 'all'],
    default: 'all',
    required: function() { return this.type === 'fileUpload'; }
  }
});

// Section Schema
const SectionSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  questions: [QuestionSchema]
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
  isPublished: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  total_marks: {
    type: Number,
    default: 0
  },
  negativeMarking: {
    type: Boolean,
    default: false
  },
  sections: [SectionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  passingMarks: {
    type: Number,
    default: 0
  },
  instructions: {
    type: String,
    default: ''
  }
});

// Pre-save hook to calculate total marks
ExamSchema.pre('save', function(next) {
  let totalMarks = 0;
  
  // Calculate total marks for the exam
  this.sections.forEach(section => {
    section.questions.forEach(question => {
      if (question.type === 'mcq') {
        totalMarks += question.positiveMarks;
      } else {
        totalMarks += question.marks;
      }
    });
  });
  
  this.total_marks = totalMarks;
  this.updatedAt = Date.now();
  next();
});

const ExamModel = mongoose.model('exams', ExamSchema);
module.exports = ExamModel; 