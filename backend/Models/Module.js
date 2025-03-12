const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ModuleSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "courses",
    required: true,
  },
  sectionId: {
    type: Schema.Types.ObjectId,
    ref: "sections",
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
  contentType: {
    type: String,
    enum: ["video", "text", "quizz"],
    required: true,
  },
  contentId: {
    type: Schema.Types.ObjectId,
    refPath: "contentType_model",
    required: true,
  },
  contentType_model: {
    type: String,
    required: true,
    enum: {
      video: "video_contents",
      text: "text_contents",
      quizz: "quizz_contents"
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const ModuleModel = mongoose.model("modules", ModuleSchema);
module.exports = ModuleModel; 