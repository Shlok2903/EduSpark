const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VideoContentSchema = new Schema({
  embededUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const VideoContentModel = mongoose.model("video_contents", VideoContentSchema);
module.exports = VideoContentModel; 