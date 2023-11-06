const User = require("../models/user");
const { validationResult, check, body } = require("express-validator");
// const io = require("../socket");

// valid mititary
exports.militaryValid = [
  check("name")
    .matches(/^[A-Z][a-z]*(?:\s[A-Z][a-z]*)+$/g)
    .withMessage("Vui lòng nhập họ tên đầy đủ và viết hoa chữ cái đầu tiên!"),
  body("id_number")
    .notEmpty()
    .withMessage("Vui lòng nhập số hiệu!")
    .custom(async (value, { req }) => {
      const military = await Military.findOne({
        id_number: req.body.id_number,
      });
      if (military) {
        throw new Error("ID đã tồn tại!");
      }
    }),

  body("object").notEmpty().withMessage("Vui lòng nhập đối tượng!"),
  body("rank").notEmpty().withMessage("Vui lòng nhập nhập cấp bậc!"),
  body("rank_time")
    .notEmpty()
    .withMessage("Vui lòng nhập nhập tháng năm nhập!"),
  body("academic_level").notEmpty().withMessage("Vui lòng nhập trình độ!"),
  body("position").notEmpty().withMessage("Vui lòng nhập chức vụ!"),
  body("location").notEmpty().withMessage("Vui lòng nhập đơn vị!"),
  body("birthday").notEmpty().withMessage("Vui lòng nhập ngày tháng năm sinh!"),
  body("join_army").notEmpty().withMessage("Vui lòng nhập tháng năm nhập ngũ!"),
  body("gender").notEmpty().withMessage("Vui lòng nhập giới tính!"),
  body("hometown").notEmpty().withMessage("Vui lòng nhập quê quán!"),
  body("address").notEmpty().withMessage("Vui lòng nhập địa chỉ!"),
  body("infor").notEmpty().withMessage("Vui lòng nhập thông tin liên hệ!"),
];

//post add mititary
exports.postAddMilitary = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      errorMessage: error.array()[0].msg,
      oldInput: req.body,
      validationErrors: error.array(),
    });
  }
  const {
    name,
    id_number,
    object,
    rank,
    rank_time,
    academic_level,
    position,
    location,
    birthday,
    join_army,
    gender,
    hometown,
    address,
    infor,
  } = req.body;
  try {
    const military = new Military({
      name,
      id_number,
      object,
      rank,
      rank_time: new Date(rank_time),
      academic_level,
      position,
      location,
      birthday: new Date(birthday),
      join_army: new Date(join_army),
      gender,
      hometown,
      address,
      infor,
    });

    const result = await military.save();
    res
      .status(200)
      .json({ message: "Thêm quân nhân thành công!", id_military: result._id });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//detete military
exports.deleteMilitary = async (req, res, next) => {
  try {
    const idMilitary = req.params.id;
    await Military.findByIdAndDelete(idMilitary);
    res.status(200).json({ message: "Xóa thành công!" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//edit military
exports.editMilitary = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      errorMessage: error.array()[0].msg,
      oldInput: req.body,
      validationErrors: error.array(),
    });
  }
  const {
    id_number,
    name,
    gender,
    object,
    phone,
    infor,
    rank,
    rank_time,
    position,
    location,
    birthday,
    join_army,
    hometown,
    address,
    academic_level,
    party,
    union_member,
    pro_expertise,
    bonus,
    discripline,
    biological_parents,
    maternal_family,
  } = req.body;
  const dataMilitary = {
    id_number,
    name,
    gender,
    object,
    phone,
    infor,
    rank,
    rank_time: new Date(rank_time),
    position,
    location,
    birthday: new Date(birthday),
    join_army: new Date(join_army),
    hometown,
    address,
    academic_level,
    party,
    union_member,
    pro_expertise,
    bonus,
    discripline,
  };
  try {
    if (biological_parents) {
      const family = new Family(biological_parents);
      const family_parents = await family.save();
      dataMilitary.biological_parents = family_parents._id;
    }
    if (maternal_family) {
      const family = new Family(maternal_family);
      const family_maternal = await family.save();
      dataMilitary.maternal_family = family_maternal._id;
    }
    const military = new Military(dataMilitary);
    const result = await military.save();
    res
      .status(200)
      .json({ message: "Cập nhật thành công!", result: result._id });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
