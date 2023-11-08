const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const familySchema = new Schema({
  id_military: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "military",
  },

  father: {
    name: {
      type: String,
      required: true,
    },
    birthday: {
      type: Date,
      required: true,
    },
    job: {
      type: String,
      required: true,
    },
    none: {
      type: String,
    },
  },
  mother: {
    name: {
      type: String,
      required: true,
    },
    birthday: {
      type: Date,
      required: true,
    },
    job: {
      type: String,
      required: true,
    },
    none: {
      type: String,
    },
  },
  address: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Family", familySchema);
