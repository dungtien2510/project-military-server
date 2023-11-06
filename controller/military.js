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
    const officer = await Military.count({ object: "officer" });

    //quân nhân chuyên nghiệp
    const pro_serviceman = await Military.count({ object: " pro_serviceman" });

    //chiến sĩ
    const soldier = await Military.count({ object: "soldier" });
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
    const rank = req.query.rank;
    const position = req.query.position;
    const location = req.query.location;
    const birthday = req.query.birthday;
    const join_army = req.query.join_army;
    const object = req.query.object;
    if (rank) query.rank = rank;
    if (location) query.location = location;
    if (join_army) query.join_army = join_army;
    if (birthday) query.birthday = birthday;
    if (position) query.position = position;
    if (object) query.object = object;
    const totalMilitarys = await Military.count(query);
    const military = await Military.find(query)
      .select(
        "name rank object position location birthday join_army hometown address"
      )
      .skip(skip)
      .limit(limit)
      .exec();
    res
      .status(200)
      .json({ military: military, totalMilitarys: totalMilitarys });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
