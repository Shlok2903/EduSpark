const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isOptional: {
    type: Boolean,
    default: true,
  },
  deadline: {
    type: Date,
  },
  imageUrl: {
    type: String,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const CourseModel = mongoose.model("courses", CourseSchema);
module.exports = CourseModel; 