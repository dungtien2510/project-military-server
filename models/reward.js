const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reward_disciplinesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("Reward", reward_disciplinesSchema);
