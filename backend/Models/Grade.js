const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Question Grade Schema
const QuestionGradeSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  maxMarks: {
    type: Number,
    required: true
  },
  feedback: String
});

// Section Grade Schema
const SectionGradeSchema = new Schema({
  sectionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  sectionName: String,
  questions: [QuestionGradeSchema],
  totalMarksAwarded: {
    type: Number,
    default: 0
  },
  maxSectionMarks: {
    type: Number,
    required: true
  }
});

// Grade Schema
const GradeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  type: {
    type: String,
    enum: ['exam', 'quiz', 'practicequiz'],
    required: true
  },
  // Reference to the content based on type
  contentId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  contentType: {
    type: String,
    required: true,
    enum: ['exams', 'quizzes', 'practicequizzes']
  },
  sections: [SectionGradeSchema],
  totalMarksAwarded: {
    type: Number,
    default: 0
  },
  maxMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pass', 'fail'],
    required: true
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  gradedAt: {
    type: Date,
    default: Date.now
  },
  attemptId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'attemptType'
  },
  attemptType: {
    type: String,
    required: true,
    enum: ['examAttempts', 'quizAttempts', 'practicequizAttempts']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to calculate total marks and percentage
GradeSchema.pre('save', function(next) {
  if (this.isModified('sections')) {
    let totalMarksAwarded = 0;
    
    this.sections.forEach(section => {
      let sectionMarks = 0;
      
      // Add up marks from all questions
      section.questions.forEach(question => {
        sectionMarks += question.marksAwarded || 0;
      });
      
      section.totalMarksAwarded = sectionMarks;
      totalMarksAwarded += sectionMarks;
    });
    
    this.totalMarksAwarded = totalMarksAwarded;
    
    // Calculate percentage
    if (this.maxMarks > 0) {
      this.percentage = (this.totalMarksAwarded / this.maxMarks) * 100;
    }
  }
  
  next();
});

const GradeModel = mongoose.model('grades', GradeSchema);
module.exports = GradeModel; 