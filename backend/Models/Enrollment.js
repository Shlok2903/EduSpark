const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema for module progress tracking
const ModuleProgressSchema = new Schema({
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: "modules",
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
});

// Schema for section progress tracking
const SectionProgressSchema = new Schema({
  sectionId: {
    type: Schema.Types.ObjectId,
    ref: "sections",
    required: true
  },
  moduleProgress: [ModuleProgressSchema],
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
});

// Main Enrollment Schema
const EnrollmentSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "courses",
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  isEnrolled: {
    type: Boolean,
    default: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number, // Overall percentage progress (0-100)
    default: 0
  },
  sectionProgress: [SectionProgressSchema],
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index to ensure one enrollment per user per course
EnrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });

const EnrollmentModel = mongoose.model("enrollments", EnrollmentSchema);
module.exports = EnrollmentModel; 