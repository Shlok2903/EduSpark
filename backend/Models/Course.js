const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  course_id: {
    type: String,
    unique: true,
    default: function() {
      return 'CRS_' + new mongoose.Types.ObjectId().toString();
    }
  },
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

// Add this line to ensure the index is created correctly
CourseSchema.index({ course_id: 1 }, { unique: true });

const CourseModel = mongoose.model("courses", CourseSchema);
module.exports = CourseModel; 