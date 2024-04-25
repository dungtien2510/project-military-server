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
    type: String,
    required: true,
  },
  location: {
    // name_location: { type: String, required: true },
    // id: {
    type: Schema.Types.ObjectId,
    ref: "Location",
    require: true,
    // },
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
    // đoàn
    type: Date,
  },
  academic_level: {
    type: String,
    required: true,
  },
  pro_expertise: {
    //chuyên môn
    type: String,
  },

  status: {
    // trạng thái (phép, công tác, viện,...)
    type: String,
    required: true,
  },
  reason: { type: String }, //lý do

  marital_status: { type: String, required: true }, // tình trạng hôn nhân

  reward: [
    // khen thưởng
    {
      id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Reward",
      },
      date: { type: Date, required: true },
      note: { type: String, required: true },
    },
  ],
  discipline: [
    // kỷ luật
    {
      id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Reward",
      },
      date: { type: Date, required: true },
      note: { type: String, required: true },
    },
  ],

  family: {
    // gia đình
    wife: { type: Schema.Types.ObjectId, ref: "Relative" },
    children: [{ type: Schema.Types.ObjectId, ref: "Relative" }],
    father: { type: Schema.Types.ObjectId, ref: "Relative" },
    mother: { type: Schema.Types.ObjectId, ref: "Relative" },
    father_wife: { type: Schema.Types.ObjectId, ref: "Relative" },
    mother_wife: { type: Schema.Types.ObjectId, ref: "Relative" },
  },
});

module.exports = mongoose.model("Military", militarySchema);
