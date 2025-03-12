const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SectionSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "courses",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
  },
  imageUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const SectionModel = mongoose.model("sections", SectionSchema);
module.exports = SectionModel; 