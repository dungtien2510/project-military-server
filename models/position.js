const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const positionSchema = new Schema({
  level: { type: Number, required: true },
  name: {
    type: String,
    required: true,
  },
  rank: { type: String, required: true },
});

module.exports = mongoose.model("Position", positionSchema);
