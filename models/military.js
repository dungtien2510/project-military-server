const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const militarySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  id_number: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  object: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    // required: true,
  },
  info: {
    type: String,
    required: true,
  },
  rank: {
    type: String,
    required: true,
  },
  rank_time: {
    type: Date,
    required: true,
  },
  position: {
    type: Schema.Types.ObjectId,
    ref: "Location",
    require: true,
  },
  location: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
  join_army: {
    type: Date,
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
  party: {
    type: Date,
  },
  union_member: {
    type: Date,
  },
  academic_level: {
    type: String,
    required: true,
  },
  pro_expertise: {
    type: String,
  },

  bonus: [
    {
      type_bonus: { type: String, required: true },
      date: { type: Date, required: true },
    },
  ],
  discipline: [
    {
      type_discipline: { type: String, required: true },
      date: { type: Date, required: true },
    },
  ],
  biological_parents: {
    type: Schema.Types.ObjectId,
  },
  maternal_family: {
    type: Schema.Types.ObjectId,
  },
});

module.exports = mongoose.model("Military", militarySchema);
