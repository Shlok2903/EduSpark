const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: [{
    text: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    }
  }],
  points: {
    type: Number,
    default: 1,
  }
});

const QuizzContentSchema = new Schema({
  description: {
    type: String,
    required: true,
  },
  questions: [QuestionSchema],
  deadline: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const QuizzContentModel = mongoose.model("quizz_contents", QuizzContentSchema);
module.exports = QuizzContentModel; 