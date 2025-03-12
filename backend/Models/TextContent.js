const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TextContentSchema = new Schema({
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

const TextContentModel = mongoose.model("text_contents", TextContentSchema);
module.exports = TextContentModel; 