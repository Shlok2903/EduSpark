const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isTutor: {
    type: Boolean,
    default: false
  },
  isStudent: {
    type: Boolean,
    default: false
  },
  // Student-specific fields
  semester: {
    type: String,
    required: function() { return this.isStudent === true; }
  },
  degree: {
    type: String,
    required: function() { return this.isStudent === true; }
  },
  parentName: {
    type: String,
    required: function() { return this.isStudent === true; }
  },
  parentEmail: {
    type: String,
    required: function() { return this.isStudent === true; }
  },
  enrolledCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'courses'
  }]
});

// Add method to check if user is enrolled in a course
UserSchema.methods.isEnrolledIn = async function(courseId) {
  const Enrollment = mongoose.model('enrollments');
  const enrollment = await Enrollment.findOne({
    userId: this._id,
    courseId: courseId,
    isEnrolled: true
  });
  return !!enrollment;
};

const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;
