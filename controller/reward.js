const { validationResult, check, body } = require("express-validator");
// const io = require("../socket");
const Military = require("../models/military");

const Location = require("../models/location");

const mongoose = require("mongoose");
const Reward = require("../models/reward");

/////////////////////////////////////////////////////////
////////////////////////////////////////////
///////////////////////////

//admin

//valid post add reward
exports.validReward = [
  check("name")
    .not()
    .isEmpty()
    .withMessage("Vui Lòng nhập tên mức khen thưởng kỷ luật!")
    .custom(async (value) => {
      const reward = await Reward.findOne({ name: value });
      if (reward) throw new Error("Tên khen thưởng kỷ luật đã tồn tại!");
    }),
  body("level").not().isEmpty().withMessage("Vui lòng chọn cấp độ!"),
  body("type")
    .not()
    .isEmpty()
    .withMessage("Vui lòng chọn loại Khen thưởng hay kỷ luật!")
    .custom((value) => {
      if (value !== "reward" && value !== "discipline")
        throw new Error("Loại không đúng!");
    }),
];

//post thêm khen thưởng kỷ luật
exports.postAddReward = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      errorMessage: error.array()[0].msg,
      oldInput: req.body,
      validationErrors: error.array(),
    });
  }

  const rewardData = {
    name: req.body.name,
    level: req.body.level,
    type: req.body.type,
  };

  try {
    const reward = new Reward(rewardData);
    const result = await reward.save();

    return res
      .status(200)
      .json({ message: "Thêm thành công!", result: result });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//edit reward
exports.editReward = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      errorMessage: error.array()[0].msg,
      oldInput: req.body,
      validationErrors: error.array(),
    });
  }
  const idReward = req.params.id;
  const rewardData = {
    name: req.body.name,
    level: req.body.level,
    type: req.body.type,
  };
  try {
    const rewardNew = await Reward.findByIdAndUpdate(idReward, rewardData, {
      new: true,
    });
    return res
      .status(200)
      .json({ message: "Sửa thành công!", result: rewardNew });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//delete reward
exports.deleteReward = async (req, res, next) => {
  const idReward = req.params.id;
  try {
    await Reward.findByIdAndDelete(idReward);
    return res.status(200).json({ message: "Xóa thành công!" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

/////////////////////////////////
/////////////
//client
//get
exports.getListReward = async (req, res, next) => {
  try {
    const type = req.query.type;

    const reward = await Reward.find(type ? { type: type } : "").exec();
    return res.status(200).json({ message: "Success!", result: reward });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//get detait
exports.getDetaitReward = async (req, res, next) => {
  try {
    const reward = await Reward.findById(req.params.id);
    return res
      .status(200)
      .json({ message: "Thêm thành công!", result: reward });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
