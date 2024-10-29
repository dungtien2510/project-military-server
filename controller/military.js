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

const Reward = require("../models/reward");

const Location = require("../models/location");

const mongoose = require("mongoose");
const Relative = require("../models/Relative");
const Position = require("../models/position");

////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/////////////////////////

//client

//get chi tiết quân nhân
exports.getIdMilitary = async (req, res, next) => {
  try {
    const idMilitary = req.params.id;
    const military = await Military.findById(idMilitary)
      .populate({
        path: "location",
        select: "name",
      })
      .populate({ path: "position", select: "name" });
    res.status(200).json(military);
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
// get thông tin tổng quan
exports.getInforGeneral = async (req, res, next) => {
  try {
    //id location của user đã đăng nhập
    const userLocation = req.user.location;

    //array location cấp mình và cấp dưới

    const arrayLocationLower = await getLocations(userLocation);

    //tổng quân số
    const totalMilitarys = await Military.countDocuments({
      location: { $in: arrayLocationLower },
    });

    //quân số có mặt
    const presentMilitarys = await Military.countDocuments({
      location: { $in: arrayLocationLower },
      status: "x",
    });

    //quân số phép
    const militarysP = await Military.countDocuments({
      location: { $in: arrayLocationLower },
      status: "p",
    });

    //quân số công tác
    const militarysCT = await Military.countDocuments({
      location: { $in: arrayLocationLower },
      status: "ct",
    });

    //quân số vieenj
    const militarysV = await Military.countDocuments({
      location: { $in: arrayLocationLower },
      status: "v",
    });

    const militarysBX = await Military.countDocuments({
      location: { $in: arrayLocationLower },
      status: "bx",
    });

    const militarysK = await Military.countDocuments({
      location: { $in: arrayLocationLower },
      status: "k",
    });

    const militarysN = await Military.countDocuments({
      location: { $in: arrayLocationLower },
      status: "n",
    });

    /////////////
    //////////quân số các đơn vị

    ///////////các đơn vị dưới 1 cấp
    const locationLower = await Location.find({ superior: userLocation });

    //tất cả các đơn vị cấp dưới
    const resultLocation = await Promise.all(
      locationLower.map(async (v, i) => {
        try {
          const listLocaLower = await getLocations(v._id);

          // const [totalMilitaryLocaLower, totalMilitaryPre, totalMilitaryAbsent] =
          //   await Promise.all([
          //     Military.countDocuments({ location: { $in: listLocaLower } }),
          //     Military.countDocuments({
          //       location: { $in: listLocaLower },
          //       status: "x",
          //     }),
          //     Military.countDocuments({
          //       location: { $in: listLocaLower },
          //       status: { $ne: "x" },
          //     }),
          //   ]);
          //tính số lượng quân nhân của đơn vị cấp dưới
          const totalMilitaryLocaLower = await Military.countDocuments({
            location: { $in: listLocaLower },
          });

          //tổng số quân nhân có mặt
          const totalMilitaryPre = await Military.countDocuments({
            location: { $in: listLocaLower },
            status: "x",
          });

          //tổng số quân nhân vắng mặt
          const totalMilitaryAbsent = await Military.countDocuments({
            location: { $in: listLocaLower },
            status: { $ne: "x" },
          });

          return {
            master: v.master,
            _id: v._id,
            superior: v.superior,
            name: v.name,
            level: v.level,
            listLocaLower,
            totalMilitaryLocaLower,
            totalMilitaryPre,
            totalMilitaryAbsent,
          };
        } catch (err) {
          throw new Error(err);
        }
      })
    );

    res.status(200).json({
      message: "success",
      totalMilitarys,
      presentMilitarys,
      absentMilitarys: {
        militarysBX,
        militarysP,
        militarysV,
        militarysCT,
        militarysK,
        militarysN,
      },
      resultLocation,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//get quân số từng đơn vị
exports.getNumberMilLoc = async (req, res, next) => {
  try {
    const idLocation = req.query.id ? req.query.id : req.user.location;
    const location = await Location.findById(idLocation);
    if (!location) throw new Error("Không tìm thấy đơn vị!");
    const listLocations = await getLocations(idLocation);

    console.log(listLocations);
    //tổng quân số
    const totalMilitarys = await Military.countDocuments({
      location: { $in: listLocations },
    });

    //quân số có mặt
    const presentMilitarys = await Military.countDocuments({
      location: { $in: listLocations },
      status: "x",
    });

    //quân số sỹ quan
    const officer = await Military.countDocuments({
      location: { $in: listLocations },
      object: "officer",
    });

    //quân số QNCN
    const pro_serviceman = await Military.countDocuments({
      location: { $in: listLocations },
      object: "serviceman",
    });

    //quân số HSQ,cs
    const soldier = await Military.countDocuments({
      location: { $in: listLocations },
      object: "soldier",
    });

    //Quân số CNVCQP
    const workers = await Military.countDocuments({
      location: { $in: listLocations },
      object: "worker",
    });

    //quân số phép
    const militarysP = await Military.countDocuments({
      location: { $in: listLocations },
      status: "p",
    });

    //quân số công tác
    const militarysCT = await Military.countDocuments({
      location: { $in: listLocations },
      status: "ct",
    });

    //quân số vieenj
    const militarysV = await Military.countDocuments({
      location: { $in: listLocations },
      status: "v",
    });

    const militarysBX = await Military.countDocuments({
      location: { $in: listLocations },
      status: "bx",
    });

    const militarysK = await Military.countDocuments({
      location: { $in: listLocations },
      status: "k",
    });

    const militarysN = await Military.countDocuments({
      location: { $in: listLocations },
      status: "n",
    });

    const locationLower = await Location.find({ superior: idLocation });

    //tất cả các đơn vị cấp dưới
    const resultLocation = await Promise.all(
      locationLower.map(async (v, i) => {
        try {
          const listLocaLower = await getLocations(v._id);

          //tính số lượng quân nhân của đơn vị cấp dưới
          const totalMilitaryLocaLower = await Military.countDocuments({
            location: { $in: listLocaLower },
          });

          //tổng số quân nhân có mặt
          const totalMilitaryPre = await Military.countDocuments({
            location: { $in: listLocaLower },
            status: "x",
          });

          //tổng số quân nhân vắng mặt
          const totalMilitaryAbsent = await Military.countDocuments({
            location: { $in: listLocaLower },
            status: { $ne: "x" },
          });

          return {
            master: v.master,
            _id: v._id,
            name: v.name,
            totalMilitaryLocaLower,
            totalMilitaryPre,
            totalMilitaryAbsent,
          };
        } catch (err) {
          throw new Error(err);
        }
      })
    );

    res.status(200).json({
      message: "success",
      nameLocation: location.name,
      master: location.master,
      totalMilitarys,
      presentMilitarys,
      absentMilitarys: {
        militarysBX,
        militarysP,
        militarysV,
        militarysCT,
        militarysK,
        militarysN,
      },
      object: {
        officer,
        pro_serviceman,
        soldier,
        workers,
      },
      locationLower: resultLocation,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//get object quân nhân
exports.getObjectMilitarys = async (req, res, next) => {
  try {
    const idLocation = req.params.id;

    const listLocation = await getLocations(idLocation);

    //tổng số quân nhân
    const totalMilitarys = await Military.countDocuments({
      location: { $in: listLocation },
    });

    // quân số sỹ quan
    const officers = await Military.countDocuments({
      location: { $in: listLocation },
      object: "officer",
    });

    //quân số QNCN
    const servicemans = await Military.countDocuments({
      location: { $in: listLocation },
      object: "serviceman",
    });

    //quân số HSQCS
    const soldiers = await Military.countDocuments({
      location: { $in: listLocation },
      object: "soldier",
    });

    //quân số CNVCQP
    const workers = await Military.countDocuments({
      location: { $in: listLocation },
      object: "worker",
    });

    res.status(200).json({
      totalMilitarys,
      officers,
      servicemans,
      soldiers,
      workers,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//get tên Quân hàm của quân nhân
exports.getNameMilitary = async (req, res, next) => {
  try {
    const name = req.query.name;
    const military = await Military.find({
      name: { $regex: name, $options: "i" }, // $options: "i" để không phân biệt chữ hoa chữ thường $regex: Sử dụng biểu thức chính quy để tìm kiếm các tên chứa từ khóa được cung cấp.
    })
      .select("name rank _id id_number")
      .exec();
    return res.status(200).json(military);
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
    const location = req.query.location
      ? req.query.location
      : req.user.location;
    const birthday = req.query.birthday;

    const join_army = req.query.join_army;
    const object = req.query.object;
    const {
      id_number,
      gender,
      phone,
      academic_level,
      status,
      marital_status,
      reward,
      discipline,
    } = req.query;
    if (rank) query.rank = rank;
    // if (location) query.location = location;
    if (join_army) {
      const startDate = new Date(join_army + "-1-1");

      const endDate = new Date(join_army + "-12-31");
      console.log(startDate, endDate);
      query.join_army = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    if (birthday) {
      const startDate = new Date(birthday, 0, 1);
      const endDate = new Date(birthday, 11, 31);
      query.birthday = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    if (position) query.position = position;
    if (object) query.object = object;
    if (id_number) query.id_number = id_number;
    if (gender) query.gender = gender;
    if (phone) query.phone = phone;
    if (academic_level) query.academic_level = academic_level;
    if (status) query.status = status;
    if (marital_status) query.marital_status = marital_status;
    if (reward)
      query.reward = {
        $elemMatch: {
          id: reward,
        },
      };
    if (discipline)
      query.discipline = {
        $elemMatch: { id: discipline },
      };

    const listLocations = await getLocations(location);

    query.location = { $in: listLocations };

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
      .populate({ path: "location", select: "name" })
      .populate({ path: "position", select: "name" })
      .select(
        "name rank object position location birthday join_army phone address"
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

exports.getListFilter = async (req, res, next) => {
  try {
    const locations = await Location.find().select("_id name level").exec();
    const reward = await Reward.find({ type: "reward" }).exec();
    const discipline = await Reward.find({ type: "discipline" }).exec();
    const positions = await Position.find().select("_id name").exec();
    return res.status(200).json({ locations, reward, discipline, positions });
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
  body("position")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập chức vụ!")
    .custom(async (value) => {
      const position = await Position.findById(value);
      if (!position) throw new Error("Chức vụ không tồn tại!");
    }),
  body("location").custom(async (value, { req }) => {
    const locationReq = await Location.findById(value);
    if (!locationReq) throw new Error("Not found location");
  }),
  body("birthday") //yy/mm/dd
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

  body("status")
    .not()
    .isEmpty()
    .withMessage(
      "Vui lòng nhập trạng thái quân nhân hiện tại (phép, công tác,...)!"
    ),
  body("marital_status")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập trạng thái hôn nhân của quân nhân!"),
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
  const data = {
    name: req.body.name,
    id_number: req.body.id_number,
    gender: req.body.gender,
    object: req.body.object,

    rank: req.body.rank,
    rank_time: new Date(req.body.rank_time),
    position: req.body.position,
    location: req.body.location,
    birthday: new Date(req.body.birthday),
    join_army: new Date(req.body.join_army),
    hometown: req.body.hometown,
    address: req.body.address,

    academic_level: req.body.academic_level,
    pro_expertise: req.body.pro_expertise,
    status: req.body.status,

    marital_status: req.body.marital_status,
    // reward: req.body.reward ? req.body.reward : [],
    // discipline: req.body.discipline ? req.body.discipline : [],
  };
  if (req.body.reward) {
    const reward = req.body.reward.filter((v) => v.type === "reward");
    const discipline = req.body.reward.filter((v) => v.type === "discipline");
    console.log(reward, "sdfas", discipline);
    data.reward = reward;
    data.discipline = discipline;
  }
  if (req.body.phone) data.phone = req.body.phone;
  if (req.body.note) data.note = req.body.note;
  if (req.body.reason) data.reason = req.body.reason;
  const family = req.body.family; // family =[{id:..., role:...}, {id:[], role: "children"}]
  if (req.body.party) {
    data.party = new Date(req.body.party);
  }
  if (req.body.union_member) {
    data.union_member = new Date(req.body.union_member);
  }

  try {
    if (family && family.length > 0) {
      const familyNew = {};
      family.forEach((v, i) => {
        familyNew[v.role] = v._id;
      });
      data.family = familyNew;
      const military = new Military(data);
      const result = await military.save();
      await Promise.all(
        family.map(async (vfam, ifam) => {
          if (vfam.role === "children") {
            await Relative.updateMany(
              { _id: { $in: vfam.id } },
              { $push: { id_military: { id: result._id, role: "children" } } }
            );
          } else {
            await Relative.updateMany(
              { _id: vfam.id },
              { $push: { id_military: { id: result._id, role: vfam.role } } }
            );
          }
        })
      );
      return res.status(200).json({
        message: "Thêm quân nhân thành công!",
        id_military: result._id,
      });
    }
    const military = new Military(data);
    const result = await military.save();
    return res
      .status(200)
      .json({ message: "Thêm quân nhân thành công!", id_military: result._id });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postManyMilitary = async (req, res, next) => {
  try {
  } catch (erro) {
    console.error(erro);
  }
};

//detete military
exports.deleteMilitary = async (req, res, next) => {
  try {
    const idMilitary = req.params.id;
    const military = await Military.findById(idMilitary);
    const family = military.family;
    if (
      family &&
      Object.keys(family).length > 0 &&
      Object.values(family).some((v, i) => v && v.length > 0)
    ) {
      // không sử dụng .map Vì map không chờ đợi các promise hoàn thành trước khi kết thúc,
      // nên việc thực hiện tất cả các promise một cách đồng thời bằng Promise.all có thể gây ra sự cố.
      // await Promise.all(
      //   Object.keys(family).map(async (vfam, ifam) => {
      //     if (vfam === "children" && family[vfam].length > 0) {
      //       console.log(family[vfam]);
      //       await Relative.updateMany(
      //         { _id: { $in: family[vfam] } },
      //         { $pull: { id_military: { id: idMilitary, role: "children" } } }
      //       );
      //     } else {
      //       console.log("asdf", family[vfam], vfam);
      //       const df = await Relative.findByIdAndUpdate(
      //         family[vfam],
      //         {
      //           $pull: { id_military: { id: idMilitary, role: family[vfam] } },
      //         },
      //         { new: true }
      //       );
      //       console.log(df);
      //     }
      //   })
      // );
      for (const [vfam, ifam] of Object.entries(family)) {
        // vfam và ifam lưu lần lượt key value của object.entries(family)
        if (vfam === "children" && ifam.length > 0) {
          await Relative.updateMany(
            { _id: { $in: ifam } },
            { $pull: { id_military: { id: idMilitary, role: "children" } } }
          );
        } else {
          await Relative.findByIdAndUpdate(ifam, {
            $pull: { id_military: { id: idMilitary, role: vfam } },
          });
        }
      }
    }
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
  const family = req.body.family;
  const idMilitary = req.params.id;
  const dataMilitary = {
    name: req.body.name,
    id_number: req.body.id_number,
    gender: req.body.gender,
    object: req.body.object,
    phone: req.body.phone ? req.body.phone : "",
    info: req.body.info,
    rank: req.body.rank,
    rank_time: new Date(req.body.rank_time),
    position: req.body.position,
    location: req.body.location,
    birthday: new Date(req.body.birthday),
    join_army: new Date(req.body.join_army),
    hometown: req.body.hometown,
    address: req.body.address,

    academic_level: req.body.academic_level,
    pro_expertise: req.body.pro_expertise,
    status: req.body.status,
    reason: req.body.reason ? req.body.reason : "",
    marital_status: req.body.marital_status,
    reward: req.body.reward ? req.body.reward : [],
    discipline: req.body.discipline ? req.body.discipline : [],
    // family [{id:..., role:...}, {id:[], role: children}]
  };
  if (req.body.party) {
    dataMilitary.party = new Date(req.body.party);
  }
  if (req.body.union_member) {
    dataMilitary.union_member = new Date(req.body.union_member);
  }
  try {
    if (family) {
      const familyNew = {};
      family.forEach((v, i) => {
        familyNew[v.role] = v.id;
      });
      dataMilitary.family = familyNew;
      const militaryOld = await Military.findById(idMilitary);
      const familyOld = militaryOld.family;

      //hàm check family khác hay không
      const checkChange = (a, b) => {
        // a is family old, b is family new
        if (Object.keys(a).length === 0 && b.length > 0) return true;

        // nếu a và b trùng nhau return false ngược lại return true
        return b.some((v, i) => {
          if (v.role === "children" && v.id.length > 0) {
            if (!a.children || a.children.length <= 0) return false;
            return a.children.some((va, ia) => {
              !v.id.some((vb, ib) => {
                return va.toString() === vb.toString();
              });
            });
          }

          if (a[v.role] && v.id.toString() === a[v.role].toString())
            return false;
          return true;
        });
      };

      if (checkChange(familyOld, family)) {
        //xóa phần family cũ
        if (familyOld.children && familyOld.children.length > 0) {
          await Relative.updateMany(
            { _id: { $in: familyOld.children } },
            { $pull: { id_military: { id: idMilitary, role: "children" } } }
          );
        }
        familyOld.children = "";
        await Promise.all(
          Object.keys(familyOld).map(async (v, i) => {
            const upd = await Relative.findByIdAndUpdate(familyOld[v], {
              $pull: { id_military: { id: idMilitary, role: v } },
            });
          })
        );
        // cập nhật relative mới
        await Promise.all(
          family.map(async (v, i) => {
            if (v.role === "children") {
              await Relative.updateMany(
                { _id: { $in: v.id } },
                {
                  $push: {
                    id_military: { id: idMilitary, role: "children" },
                  },
                }
              );
            } else {
              await Relative.findByIdAndUpdate(v.id, {
                $push: { id_military: { id: idMilitary, role: v.role } },
              });
            }
          })
        );
      }
    }
    const military = await Military.findByIdAndUpdate(
      idMilitary,
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
