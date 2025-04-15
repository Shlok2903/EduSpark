const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Question schema to store individual questions and answers
const QuestionSchema = new Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  userAnswer: {
    type: String,
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
});

// Main Practice Schema
const PracticeSchema = new Schema({
  practice_id: {
    type: String,
    unique: true,
    default: function() {
      return 'PRC_' + new mongoose.Types.ObjectId().toString();
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "courses",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },
  numberOfQuestions: {
    type: Number,
    required: true,
    min: 5,
    max: 50
  },
  startTime: {
    type: Date,
    default: null
  },
  timeLimit: {
    type: Number, // in seconds
    default: function() {
      // Default to 1 minute per question
      return this.numberOfQuestions * 60;
    }
  },
  timeRemaining: {
    type: Number, // in seconds
    default: function() {
      return this.timeLimit;
    }
  },
  questions: [QuestionSchema],
  correctAnswers: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Create index for practice_id
PracticeSchema.index({ practice_id: 1 }, { unique: true });

const PracticeModel = mongoose.model("practices", PracticeSchema);
module.exports = PracticeModel; 