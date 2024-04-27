const { validationResult, check, body } = require("express-validator");
// const io = require("../socket");
const Military = require("../models/military");

const Location = require("../models/location");

const mongoose = require("mongoose");
// valid mititary

/////////////////////////////////////////
/////////////////////////
////////
//admin

// hàm tìm location
const getLocations = async (idLoc, maxDepth) => {
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
          maxDepth: maxDepth ? Number(maxDepth) : 20, // Đặt giá trị tối đa cho độ sâu
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
    // const error = new Error(err);
    // error.httpStatusCode = 500;
    // return next(error);
    throw new Error("ERROR");
  }
};

// validator add location
exports.locationValidator = [
  check("name")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập tên đơn vị!")
    .custom(async (value, { req }) => {
      const locationMatch = await Location.findOne({ name: value });

      if (req.params.id) {
        const locationOld = await Location.findById(req.params.id);
        if (
          locationMatch &&
          locationMatch._id.toString() !== locationOld._id.toString()
        )
          throw new Error("Tên đơn vị đã tồn tại");
      } else {
        if (locationMatch) throw new Error("Tên đơn vị đã tồn tại");
      }
    }),
  body("level")
    .not()
    .isEmpty()
    .withMessage("Vui lòng nhập cấp đơn vị")
    .custom(async (value, { req }) => {
      if (req.body.superior) {
        const locationSuperior = await Location.findById(req.body.superior);
        if (!locationSuperior) throw new Error("Không tồn tại cấp trên này!");
        if (locationSuperior.level <= value)
          throw new Error("Cấp đơn vị phải thấp hơn cấp của cấp trên!");
      }
    }),
  // body("superior").custom(async (value) => {
  //   if (value) {
  //     const superior = await Location.findById(value);
  //     if (!superior) throw new Error("Không tồn tại cấp trên này");

  //   }
  // }),
  body("id_master")
    .not()
    .isEmpty()
    .withMessage("Vui lòng chọn người đứng đầu!")
    .custom(async (value, { req }) => {
      if (value) {
        const idMilitary = await Military.findById(value);
        if (!idMilitary) throw new Error("Quân nhân không tồn tại!");
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

  try {
    // if (req.body.lower_level) {
    //   const lower = req.body.lower_level.split(";");
    //   const locationLower = await Location.find({ _id: { $in: lower } }).exec();
    //   if (locationLower.some((item) => item.level <= req.body.level))
    //     throw new Error("invalid level");
    // }
    // if (req.body.superior) {
    //   locationData.superior = req.body.superior;
    //   const superior = await Location.findById(locationData.superior);
    //   locationData.level = superior.level - 1;
    // } else {
    //   locationData.level = req.body.level;
    // }

    const master = await Military.findById(req.body.id_master);

    locationData.master = {
      id: req.body.id_master,
      fullName: master.name,
    };

    const location = new Location(locationData);
    const idLocation = await location.save();

    // Update location of military
    await Military.findByIdAndUpdate(master._id, { location: idLocation._id });

    return res
      .status(200)
      .json({ message: "Thêm thành công!", location: location });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

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
  if (req.body.superior) {
    locationData.superior = req.body.superior;
  }

  try {
    const master = await Military.findById(req.body.id_master);
    locationData.master = {
      id: master._id,
      fullname: master.name,
    };

    //hàm kiểm tra thay đổi level
    // const changeLevelValue = async (idLocation, idSuperior) => {
    //   if(!idSuperior) return
    //   try{
    //     const locationPresent = await Location.findById(idLocation)
    //     const superiorNew = await Location.findById(idSuperior)
    //     if(locationPresent.superior.toString() === superiorNew._id.toString()) return

    //     const superiorPresent = await Location.findById(locationPresent.superior)
    //     const changeLevel = superiorNew.level - superiorPresent.level
    //     if(!changeLevel) return

    //   }catch(err){ throw new Error(err)}
    // };

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

//delete location details để lại đơn vị cấp dưới
exports.deleteLocation = async (req, res, next) => {
  const idLocation = req.params.id;
  try {
    const filter = { superior: idLocation };
    const update = { $unset: { superior: 1 } };

    const numberUpdate = await Location.updateMany(filter, update);

    await Location.findByIdAndDelete(idLocation);
    return res.status(200).json({ message: "Success", numberUpdate });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// destroy a location
exports.destroyLocation = async (req, res, next) => {
  const idLocation = req.params.id;
  try {
    const listLocations = await getLocations(idLocation);

    const result = await Location.deleteMany({ _id: { $in: listLocations } });
    return res.status(200).json({ message: "Success", numberDelete: result });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////
////////////////////////////////

//client

//get Location lower
exports.getListLocation = async (req, res, next) => {
  try {
    const maxDepth = req.query.maxDepth;
    const idLocation = req.query.id ? req.query.id : req.user.location;
    const level = req.query.level;
    console.log(idLocation);
    const listIdLocations = await getLocations(idLocation, maxDepth);
    if (level) {
      const listLocations = await Location.find({
        $and: [{ _id: { $in: listIdLocations } }, { level: level }],
      });
      return res.status(200).json({
        message: "Success",
        result: listLocations,
      });
    } else {
      const listLocations = await Location.find({
        _id: { $in: listIdLocations },
      });
      return res.status(200).json({
        message: "Success",
        result: listLocations,
      });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// // get location
// exports.getListLocation = async (req, res, next) => {
//   try {
//     const listLocation = await Location.find().select("name master");
//     return res.status(200).json({ message: "Success", result: listLocation });
//   } catch (err) {
//     const error = new Error(err);
//     error.httpStatusCode = 500;
//     return next(error);
//   }
// };

//get location details
// exports.getLocationDetails = async (req, res, next) => {
//   const idLocation = req.params.id;
//   try {
//     const locationDetails = await Location.findById(idLocation);
//     const locationLower = await Location.find({ superior: idLocation });

//     return res
//       .status(200)
//       .json({ message: "Success", result: { locationDetails, locationLower } });
//   } catch (err) {
//     const error = new Error(error);
//     error.httpStatusCode = 500;
//     return next(error);
//   }
// };
