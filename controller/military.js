const Military = require("../models/military");
const { check, body, validationResult } = require("express-validator");

const User = require("../models/user");
const fs = require("fs");

// thư viện mustache để thay thế một chuỗi trong tệp HTML bằng dữ liệu thực tế:
const mustache = require("mustache");

//Module path cung cấp các phương thức hữu ích để làm việc với các đường dẫn tệp tin và thư mục trong ứng dụng Node.js.
const path = require("path");

//pdfkit là một gói thư viện của Node.js được sử dụng để tạo và tùy chỉnh tập tin PDF
const PDFDocument = require("pdfkit");

// const { getIO } = require("../socket");
// const { result } = require("lodash");

const Family = require("../models/family");

const Location = require("../models/location");

const mongoose = require("mongoose");

////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/////////////////////////

//client

//get chi tiết quân nhân
exports.getIdMilitary = async (req, res, next) => {
  try {
    const idMilitary = req.params.id;
    const military = await Military.findById(idMilitary);
    res.status(200).json(military);
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//get thông tin chung gồm SQ, QNCN, CS
exports.getInforGeneral = async (req, res, next) => {
  try {
    //tổng số quân nhân
    const totalMilitarys = await Military.countDocuments();

    //sỹ quan
    const officer = await Military.countDocuments({ object: "officer" });

    //quân nhân chuyên nghiệp
    const pro_serviceman = await Military.countDocuments({
      object: "pro_serviceman",
    });

    //chiến sĩ
    const soldier = await Military.countDocuments({ object: "soldier" });

    res.status(200).json({
      message: "Success",
      result: {
        officer: officer,
        pro_serviceman: pro_serviceman,
        soldier: soldier,
        totalMilitarys,
      },
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//get quân nhân theo điều kiện lọc
exports.getMilitarys = async (req, res, next) => {
  try {
    const skip = req.query.skip || 0;
    const limit = req.query.limit || 20;
    const query = {};
    const name = req.query.name;
    const rank = req.query.rank;
    const position = req.query.position;
    const location = req.query.location;
    const birthday = req.query.birthday;
    const join_army = req.query.join_army;
    const object = req.query.object;
    if (rank) query.rank = rank;
    // if (location) query.location = location;
    if (join_army) query.join_army = join_army;
    if (birthday) query.birthday = birthday;
    if (position) query.position = position;
    if (object) query.object = object;
    let arrayLocation;
    if (location) {
      arrayLocation = await Location.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(location),
          },
        },
        {
          $graphLookup: {
            from: "locations",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "superior",
            as: "locationsHierarchy",
            // restrictSearchWithMatch: {}, // Có thể thêm điều kiện tìm kiếm nếu cần
            // depthField: "depth", // có thể lấy thông tin độ sâu từ trường depth
            // maxDepth: 3, // Đặt giá trị tối đa cho độ sâu
          },
        },
        {
          $project: {
            "locationsHierarchy._id": 1, // chỉ lấy phần _id của location
            // "locationsHierarchy.name": 1, // chỉ lấy phần name của location
            // "locationsHierarchy.depth": 1, // thông tin độ sâu
          },
        },
      ]);
      const locations = arrayLocation[0].locationsHierarchy.map(
        (item) => item._id
      );
      locations.push(arrayLocation[0]._id);
      query["location.id"] = { $in: locations };
    }
    const queryfunction = (name) => {
      const arr = Object.entries(query).map(([key, value]) => ({
        [key]: value,
      }));
      return { $and: [{ $text: { $search: name } }, ...arr] };
    };
    const totalMilitarys = await Military.countDocuments(
      name ? queryfunction(name) : query
      // { $text: { $search: name } }
    );
    const military = await Military.find(name ? queryfunction(name) : query)
      // { $text: { $search: name } }

      .select(
        "name rank object position location birthday join_army hometown address"
      )
      .skip(skip)
      .limit(limit)
      .exec();
    res.status(200).json({
      military: military,
      totalMilitarys: totalMilitarys,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

///////////////////////////////////////////////////
//////////////////////////////
//////////////////

//admin

exports.militaryValid = [
  check("name")
    // .matches(/^[A-Z][a-z]*(?:\s[A-Z][a-z]*)+$/g)
    .not()
    .isEmpty()
    // .isAlphanumeric()
    .withMessage("Vui lòng nhập họ tên!"),

  body("object").not().isEmpty().withMessage("Vui lòng nhập đối tượng!"),
  body("rank").not().isEmpty().withMessage("Vui lòng nhập nhập cấp bậc!"),
  body("rank_time")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập nhập tháng năm nhập!"),
  body("academic_level").not().isEmpty().withMessage("Vui lòng nhập trình độ!"),
  body("position").not().isEmpty().withMessage("Vui lòng nhập chức vụ!"),
  body("location").custom(async (value, { req }) => {
    const locationReq = await Location.findById(value);
    if (!locationReq) throw new Error("Not found location");
  }),
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
    const name_location = await Location.findById(location);

    const military = new Military({
      name,
      id_number,
      object,
      rank,
      rank_time: new Date(rank_time),
      academic_level,
      position,
      location: { name_location: name_location.name, id: location },
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
    info,
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
    info,
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
    const name_location = await Location.findById(location);
    const dataMilitary = {
      id_number,
      name,
      gender,
      object,
      phone,
      info,
      rank,
      rank_time: new Date(rank_time),
      position,
      location: { name_location: name_location.name, id: location },
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
    const military = await Military.findByIdAndUpdate(
      req.params.id,
      dataMilitary,
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Cập nhật thành công!", result: military._id });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
