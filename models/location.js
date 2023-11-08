const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const locationSchema = new Schema({
  level: { type: Number, required: true },
  name: {
    type: String,
    required: true,
  },
  superior: {
    type: Schema.Types.ObjectId,
    ref: "Location",
  },

  master: {
    id: {
      type: Schema.Types.ObjectId,

      ref: "Military",
    },
    fullName: { type: String },
  },
});

module.exports = mongoose.model("Location", locationSchema);
