const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const locationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  lower_level: [
    {
      type: Schema.Types.ObjectId,
      ref: "Location",
    },
  ],
  master: {
    id: {
      type: Schema.Types.ObjectId,

      ref: "Military",
    },
    fullName: { type: String },
  },
});

module.exports = mongoose.model("Location", locationSchema);
