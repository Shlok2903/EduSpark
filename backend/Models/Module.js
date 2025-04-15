const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema for different content types
const VideoContentSchema = new Schema({
  videoUrl: {
    type: String,
    required: true
  }
});

const TextContentSchema = new Schema({
  content: {
    type: String,
    required: true
  }
});

const QuizOptionSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
});

const QuizQuestionSchema = new Schema({
  question: {
    type: String,
    required: true
  },
  options: [QuizOptionSchema],
  marks: {
    type: Number,
    default: 1
  }
});

const QuizContentSchema = new Schema({
  questions: [QuizQuestionSchema],
  passingScore: {
    type: Number,
    default: 70
  },
  timer: {
    type: Number,
    default: 0,  // Time in minutes, 0 means no time limit
    min: 0
  },
  deadline: {
    type: Date,
    default: null  // null means no deadline
  },
  maxAttempts: {
    type: Number,
    default: 0,  // 0 means unlimited attempts
    min: 0
  },
  totalMarks: {
    type: Number,
    default: function() {
      // Calculate total marks based on questions
      return this.questions ? this.questions.reduce((sum, q) => sum + (q.marks || 1), 0) : 0;
    }
  }
});

// Main Module Schema
const ModuleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sectionId: {
    type: Schema.Types.ObjectId,
    ref: "sections",
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "courses",
    required: true
  },
  contentType: {
    type: String,
    enum: ["text", "video", "quizz"],
    required: true
  },
  // Store the appropriate content based on the contentType
  videoContent: VideoContentSchema,
  textContent: TextContentSchema,
  quizContent: QuizContentSchema,
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ModuleModel = mongoose.model("modules", ModuleSchema);
module.exports = ModuleModel; 