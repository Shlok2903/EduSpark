const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SemesterSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'branches',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on document update
SemesterSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

const SemesterModel = mongoose.model("semesters", SemesterSchema);
module.exports = SemesterModel; 