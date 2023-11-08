const User = require("../models/user");
const { validationResult, check, body } = require("express-validator");
// const io = require("../socket");
const Military = require("../models/military");

const Location = require("../models/location");
// valid mititary
exports.militaryValid = [
  check("name")
    // .matches(/^[A-Z][a-z]*(?:\s[A-Z][a-z]*)+$/g)
    .not()
    .isEmpty()
    // .isAlphanumeric()
    .withMessage("Vui lòng nhập họ tên!"),
  body("id_number")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập số hiệu!")
    .custom(async (value, { req }) => {
      const military = await Military.findOne({
        id_number: req.body.id_number,
      });
      if (military) {
        throw new Error("ID đã tồn tại!");
      }
    }),

  body("object").not().isEmpty().withMessage("Vui lòng nhập đối tượng!"),
  body("rank").not().isEmpty().withMessage("Vui lòng nhập nhập cấp bậc!"),
  body("rank_time")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập nhập tháng năm nhập!"),
  body("academic_level").not().isEmpty().withMessage("Vui lòng nhập trình độ!"),
  body("position").not().isEmpty().withMessage("Vui lòng nhập chức vụ!"),
  body("location").not().isEmpty().withMessage("Vui lòng nhập đơn vị!"),
  body("birthday")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập ngày tháng năm sinh!"),
  body("join_army")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập tháng năm nhập ngũ!"),
  body("gender").not().isEmpty().withMessage("Vui lòng nhập giới tính!"),
  body("hometown").not().isEmpty().withMessage("Vui lòng nhập quê quán!"),
  body("address").not().isEmpty().withMessage("Vui lòng nhập địa chỉ!"),
  body("info").not().isEmpty().withMessage("Vui lòng nhập thông tin liên hệ!"),
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
    info,
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
      info,
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

//////////////////
// validator add location

exports.locationValidator = [
  check("name")
    .not()
    .isEmpty()
    .withMessage("Invalid Name")
    .custom(async (value, { req }) => {
      const locationMatch = await Location.findOne({ name: value });
      if (locationMatch) throw new Error("Tên đơn vị đã tồn tại");
    }),
  body("level")
    .not()
    .isEmpty()
    .withMessage("Invalid Level")
    .custom(async (value, { req }) => {
      if (req.body.lower_level) {
        const lower = req.body.lower_level.split(";");
        const locationLower = await Location.find({
          _id: { $in: lower },
        }).exec();
        if (locationLower.some((item) => item.level <= value))
          throw new Error("invalid level");
      }
    }),
  body("id_master").custom(async (value, { req }) => {
    if (value) {
      const idMilitary = await Military.findById(value);
      if (!idMilitary) throw new Error("Invalid id Master");
    }
  }),
];

//add location
exports.postAddLocation = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      errorMessage: error.array()[0].msg,
      oldInput: req.body,
      validationErrors: error.array(),
    });
  }

  const locationData = {
    name: req.body.name,
    level: req.body.level,
  };
  if (req.body.lower_level) {
    locationData.lower_level = req.body.lower_level.split(";");
  }
  if (req.body.id_master) {
    locationData.master = {
      id: req.body.id_master,
      fullName: req.body.fullName,
    };
  }
  try {
    // if (req.body.lower_level) {
    //   const lower = req.body.lower_level.split(";");
    //   const locationLower = await Location.find({ _id: { $in: lower } }).exec();
    //   if (locationLower.some((item) => item.level <= req.body.level))
    //     throw new Error("invalid level");
    // }
    const location = new Location(locationData);
    await location.save();
    return res
      .status(200)
      .json({ message: "Thêm thành công!", location: location });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.locationEditValidator = [
  check("name").not().isEmpty().withMessage("Invalid Name"),
  body("id_master").custom(async (value, { req }) => {
    if (value) {
      const idMilitary = await Military.findById(value);
      if (!idMilitary) throw new Error("Invalid id Master");
    }
  }),
  body("level")
    .not()
    .isEmpty()
    .withMessage("Invalid Level")
    .custom(async (value, { req }) => {
      if (req.body.lower_level) {
        const lower = req.body.lower_level.split(";");
        const locationLower = await Location.find({
          _id: { $in: lower },
        }).exec();
        if (locationLower.some((item) => item.level <= value))
          throw new Error("invalid level");
      }
    }),
];

//edit location
exports.postEditLocation = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty())
    res.status(422).json({
      errorMessage: error.array()[0].msg,
      oldInput: req.body,
      validationErrors: error.array(),
    });
  const locationData = {
    name: req.body.name,
    level: req.body.level,
  };
  if (req.body.lower_level) {
    locationData.lower_level = req.body.lower_level.split(";");
    console.log(locationData);
  }
  if (req.body.id_master && req.body.fullName) {
    locationData.master = {
      fullname: req.body.fullName,
      id: req.body.id_master,
    };
  }
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      locationData,
      { new: true }
    );
    return res.status(200).json({ message: "Success", result: location });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// get location
exports.getListLocation = async (req, res, next) => {
  try {
    const listLocation = await Location.find().select("name master");
    return res.status(200).json({ message: "Success", result: listLocation });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//get location details
exports.getLocationDetails = async (req, res, next) => {
  const idLocation = req.params.id;
  try {
    const locationDetails = await Location.findById(idLocation);
    return res
      .status(200)
      .json({ message: "Success", result: locationDetails });
  } catch (err) {
    const error = new Error(error);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//delete location details
exports.deleteLocation = async (req, res, next) => {
  const idLocation = req.params.id;
  try {
    await Location.findByIdAndDelete(idLocation);
    return res.status(200).json({ message: "Success" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
