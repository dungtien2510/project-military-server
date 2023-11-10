const User = require("../models/user");
const { validationResult, check, body } = require("express-validator");
// const io = require("../socket");
const Military = require("../models/military");

const Location = require("../models/location");
// valid mititary

/////////////////////////////////////////
/////////////////////////
////////
//admin

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
      if (req.body.superior) {
        const locationSuperior = await Location.findById(req.body.superior);
        if (!locationSuperior) throw new Error("Invalid superior not found");
        if (locationSuperior.level >= value)
          throw new Error("invalid superior level");
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
  if (req.body.superior) {
    locationData.superior = req.body.superior;
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
  check("name")
    .not()
    .isEmpty()
    .withMessage("Invalid Name")
    .custom(async (value, { req }) => {
      const locationName = await Location.find({ name: value }).exec();
      if (locationName.length > 0) {
        if (locationName.some((item) => item._id.toString() !== req.params.id))
          throw new Error("Tên đơn vị đã tồn tại!");
      }
    }),
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
      if (req.body.superior) {
        const locationSuperior = await Location.findById(req.body.superior);
        if (!locationSuperior) throw new Error("Invalid superior not found");
        if (locationSuperior.level >= value)
          throw new Error("invalid superior level");
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
  if (req.body.superior) {
    locationData.superior = req.body.superior;
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

//delete location details để lại đơn vị cấp dưới
exports.deleteLocation = async (req, res, next) => {
  const idLocation = req.params.id;
  try {
    const filter = { superior: idLocation };
    const update = { $unset: { superior: 1 } };

    const numberUpdate = await Location.updateMany(filter, update);
    console.log(numberUpdate);
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
    await Location.findByIdAndDelete(idLocation);
    const result = await Location.deleteMany({ superior: idLocation });
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
