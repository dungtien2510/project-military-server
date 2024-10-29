const { validationResult, check, body } = require("express-validator");

const Position = require("../models/position");

////////////////////////////////////////////
///////////////
//client

exports.getPosition = async (req, res, next) => {
  const name = req.query.name;
  const level = req.query.level;
  const rank = req.query.rank;
  const query = {};
  try {
    if (level) query.level = level;
    if (rank) query.rank = rank;
    const queryfunction = (name) => {
      const arr = Object.entries(query).map(([key, value]) => ({
        [key]: value,
      }));
      return { $and: [{ $text: { $search: name } }, ...arr] };
    };
    const positions = await Position.find(
      name ? queryfunction(name) : query
    ).exec();
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

//get name position
exports.getNamePosition = async (req, res, next) => {
  const name = req.query.name;
  try {
    const result = await Position.find({
      name: { $regex: name, $options: "i" }, // $options: "i" để không phân biệt chữ hoa chữ thường $regex: Sử dụng biểu thức chính quy để tìm kiếm các tên chứa từ khóa được cung cấp.
    })
      .select("name _id")
      .exec();
    return res.status(200).json(result);
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
    console.log("thêm thành công chức vụ thành công");
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
