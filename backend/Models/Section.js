const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SectionSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "courses",
    required: true
  },
  deadline: {
    type: Date
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SectionModel = mongoose.model("sections", SectionSchema);
module.exports = SectionModel; 