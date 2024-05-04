const express = require("express");
const router = express.Router();
const militaryController = require("../controller/military");
const locationController = require("../controller/location");

// router.get("/military/general", militaryController.getInforGeneral);

// get sô lượng quân nhân từng đơn vị
router.get("/military/general", militaryController.getNumberMilLoc);

// get đối tượng của quân nhân
router.get("/military/object/:id", militaryController.getObjectMilitarys);

// lọc military
router.get("/military/list", militaryController.getMilitarys);

// router.get("/military/total", militaryController.getInforTotal);

router.get("/military/detail/:id", militaryController.getIdMilitary);

/////////////////////////////////////////////
////////////////////////////////
// Location

// get list of location
router.get("/location/list", locationController.getListLocation);

module.exports = router;
