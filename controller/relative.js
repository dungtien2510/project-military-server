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

const Relative = require("../models/Relative");

const Location = require("../models/location");

const mongoose = require("mongoose");

////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/////////////////////////

//client

//get chi tiết người thân
exports.getIdRelative = async (req, res, next) => {
  try {
    const idRelative = req.params.id;
    const relative = await Relative.findById(idRelative);
    res.status(200).json(relative);
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
///////////////////////////////////////////////
/////////////////////////////////
/////////
///GET PHẦN CHUNG

// hàm tìm các đơn vị cấp dưới của locationLower
const getLocations = async (idLoc) => {
  try {
    const arrayLocation = await Location.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(idLoc), /////////
        },
      },
      {
        $graphLookup: {
          //$graphLookup: Đây là giai đoạn thứ hai của pipeline và nó thực hiện một tìm kiếm đệ quy trong biểu đồ.
          from: "locations",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "superior",
          as: "locationsHierarchy",
          restrictSearchWithMatch: { superior: { $exists: true } },
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
    const result = [arrayLocation[0]._id];
    arrayLocation[0].locationsHierarchy.forEach((v, i) => {
      result.push(v._id);
    });
    return result;
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//////////////////////////////

///////////////////////////////////////////////////
//////////////////////////////
//////////////////

//admin

exports.relativeValid = [
  check("name")
    .not()
    .isEmpty()
    // .isAlphanumeric()
    .withMessage("Vui lòng nhập họ tên!"),
  body("id_military")
    .not()
    .isEmpty()
    .withMessage("Vui lòng chọn quân nhân!")
    .custom(async (value) => {
      const arrayError = await Promise.all(
        value.map(async (v, i) => {
          const military = await Military.findById(v.id);

          if (
            (v.role !== "children") &
            (v.role !== "wife") &
            (v.role !== "father") &
            (v.role !== "mother") &
            (v.role !== "father_wife") &
            (v.role !== "mother_wife")
          ) {
            return new Error("Người thân không hợp lệ!");
          }
          if (!military) {
            return new Error(`Quân nhân ${v.id} không tồn tại!`);
          }
        })
      );
      const firstError = arrayError.find((error) => error); // Tìm lỗi đầu tiên
      if (firstError) {
        throw firstError; // Nếu có lỗi, ném nó ra
      }
    }),
  body("birthday") //yy/mm/dd
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập ngày tháng năm sinh!"),

  body("gender").not().isEmpty().withMessage("Vui lòng nhập giới tính!"),
  body("hometown").not().isEmpty().withMessage("Vui lòng nhập quê quán!"),
  body("address").not().isEmpty().withMessage("Vui lòng nhập địa chỉ!"),
  body("job").not().isEmpty().withMessage("Vui lòng nhập Nghề nghiệp!"),
];

//post add mititary
exports.postAddRelative = async (req, res, next) => {
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
    birthday,
    gender,
    hometown,
    address,
    info,
    job,
    id_military,
    note,
    phone,
  } = req.body;

  try {
    const relative = new Relative({
      name,
      id_military,
      birthday: new Date(birthday), // yy/mm/dd
      gender,
      hometown,
      address,
      info: info ? info : "",
      job,
      phone: phone ? phone : "",
      note: note ? note : "",
    });

    const result = await relative.save();
    await Promise.all(
      id_military.map(async (v, i) => {
        if (v.role === "children") {
          await Military.findByIdAndUpdate(v.id, {
            $push: { "family.children": result._id },
          });
        } else {
          const military = await Military.findById(v.id);
          if (military.family[v.role]) {
            await Relative.findByIdAndDelete(military.family[v.role]);
          }

          await Military.findByIdAndUpdate(v.id, {
            [`family.${v.role}`]: result._id,
          });
        }
      })
    );

    res.status(200).json({
      message: "Thêm người thân thành công!",
      id_relative: result._id,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//detete military
exports.deleteRelative = async (req, res, next) => {
  try {
    const idRelative = req.params.id;

    const relative = await Relative.findById(idRelative);
    await Promise.all(
      relative.id_military.map(async (v, i) => {
        if (v.role === "children") {
          await Military.findByIdAndUpdate(v.id, {
            $pull: { [`family.${v.role}`]: idRelative },
          });
        } else {
          await Military.findByIdAndUpdate(v.id, {
            $unset: { [`family.${v.role}`]: "" }, // xóa đi 1 trường $unset
          });
        }
      })
    );

    await Relative.findByIdAndDelete(idRelative);

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
    status,
    reason,
    marital_status,
    reward,
    discripline,
    family,
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
    status,
    reason,
    marital_status,

    reward,
    discripline,
    family,
  };
  try {
    const name_location = await Location.findById(location);
    // const dataMilitary = {
    //   id_number,
    //   name,
    //   gender,
    //   object,
    //   phone,
    //   info,
    //   rank,
    //   rank_time: new Date(rank_time),
    //   position,
    //   location: { name_location: name_location.name, id: location },
    //   birthday: new Date(birthday),
    //   join_army: new Date(join_army),
    //   hometown,
    //   address,
    //   academic_level,
    //   party,
    //   union_member,
    //   pro_expertise,
    //   bonus,
    //   discripline,
    // };
    // if (biological_parents) {
    //   const family = new Family(biological_parents);
    //   const family_parents = await family.save();
    //   dataMilitary.biological_parents = family_parents._id;
    // }
    // if (maternal_family) {
    //   const family = new Family(maternal_family);
    //   const family_maternal = await family.save();
    //   dataMilitary.maternal_family = family_maternal._id;
    // }
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
