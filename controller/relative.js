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

//edit military
exports.editRelative = async (req, res, next) => {
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
    const idRelative = req.params.id;
    const relativeEdit = {
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
    };
    const relativeOld = await Relative.findById(idRelative);

    //hàm kiểm tra 2 array khác nhau
    const equalsCheck = (a, b) => {
      if (a.length !== b.length) return false;

      const check = a.some((value) => {
        if (
          !b.some(
            (vb) =>
              vb.id.toString() === value.id.toString() && vb.role === value.role
          )
        )
          return true;
      });

      return !check;
    };

    //kiểm tra 2 array id_military của phần cũ và mới có khác nhau không
    const arrIdMili = equalsCheck(id_military, relativeOld.id_military);
    if (!arrIdMili) {
      console.log("equalsCheck");

      //nếu khác xóa người thân ở quân nhân cũ
      await Promise.all(
        relativeOld.id_military.map(async (v, i) => {
          if (v.role === "children") {
            await Military.findByIdAndUpdate(v.id, {
              $pull: { "family.children": idRelative },
            });
          } else {
            await Military.findByIdAndUpdate(v.id, {
              $unset: {
                [`family.${v.role}`]: idRelative,
              },
            });
          }
        })
      );

      //sau đó thêm người thân hiện tại vào các military mới khác
      await Promise.all(
        id_military.map(async (v, i) => {
          if (v.role === "children") {
            await Military.findByIdAndUpdate(v.id, {
              $push: { "family.children": idRelative },
            });
            await Military.findByIdAndUpdate(v.id, {
              [`family.${v.role}`]: idRelative,
            });
          }
        })
      );
    }

    const relative = await Relative.findByIdAndUpdate(
      idRelative,
      relativeEdit,
      { new: true }
    );
    res.status(200).json({
      message: "Sửa người thân thành công!",
      id_relative: relative._id,
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
            $pull: { "family.children": idRelative },
          });
        } else {
          await Military.findByIdAndUpdate(v.id, {
            $unset: { [`family.${v.role}`]: "" }, // xóa đi 1 trường $unset
          });
        }
      })
    );

    await Relative.findByIdAndDelete(idRelative, relativeEdit);

    res.status(200).json({ message: "Xóa thành công!" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
