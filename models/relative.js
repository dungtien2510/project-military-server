const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const relativeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  id_military: {
    type: Schema.Type.ObjectId,
    ref: "Military",
    required: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  hometown: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  info: {
    type: String,
  },
  job: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Relative", relativeSchema);
