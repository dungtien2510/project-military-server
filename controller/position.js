const { validationResult, check, body } = require("express-validator");

const Position = require("../models/position");

////////////////////////////////////////////
///////////////
//client

exports.getPosition = async (req, res, next) => {
  try {
    const positions = await Position.find().exec();
    return res.status(200).json(positions);
  } catch (err) {
    const error = new Error(err);
    error.httpStatus = 500;
    return next(error);
  }
};

//get detail
exports.getDetailPosition = async (req, res, next) => {
  try {
    const result = await Position.findById(req.params.id);
    return res.status(200).json({ message: "Succress", result });
  } catch (err) {
    const error = new Error(err);
    error.httpStatus = 500;
    return next(error);
  }
};

////////////////////////////////////////////
//////////////////////////////////
/////////
//admin
//validation post postion
exports.validatePostion = [
  check("name")
    .not()
    .isEmpty()
    .withMessage("Vui lòng không để trống tên!")
    .custom(async (value, { req }) => {
      const position = await Position.findOne({ name: value });
      if (req.params.id) {
        const positionOld = await Position.findById(req.params.id);
        if (position && position._id.toString() !== positionOld._id.toString())
          throw new Error("Tên chức vụ đã tồn tại!");
      } else {
        if (position) throw new Error("Tên chức vụ đã tồn tại!");
      }
    }),
  body("level").not().isEmpty().withMessage("Vui Lòng nhập cấp bậc!"),
  body("rank").not().isEmpty().withMessage("Vui lòng nhập trần quân hàm!"),
];

// post position
exports.postPosition = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      errorMessage: error.array()[0].msg,
      oldInput: req.body,
      validationErrors: error.array(),
    });
  }
  const positionData = {
    name: req.body.name,
    level: req.body.level,
    rank: req.body.rank,
  };
  try {
    const position = new Position(positionData);
    const result = await position.save();
    return res
      .status(200)
      .json({ message: "Thêm Chức vụ thành công!", result });
  } catch (err) {
    const error = new Error(err);
    error.httpStatus = 500;
    return next(error);
  }
};

// edit a position
exports.putPosition = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      errorMessage: error.array()[0].msg,
      oldInput: req.body,
      validationErrors: error.array(),
    });
  }
  const positionData = {
    name: req.body.name,
    level: req.body.level,
    rank: req.body.rank,
  };
  try {
    const result = await Position.findByIdAndUpdate(
      req.params.id,
      positionData,
      { new: true }
    );
    return res
      .status(200)
      .json({ message: "Thêm Chức vụ thành công!", result });
  } catch (err) {
    const error = new Error(err);
    error.httpStatus = 500;
    return next(error);
  }
};
