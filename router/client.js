const express = require("express");
const router = express.Router();
const militaryController = require("../controller/military");
const locationController = require("../controller/location");
const positionController = require("../controller/position");
const relativeController = require("../controller/relative");
const rewardController = require("../controller/reward");
// router.get("/military/general", militaryController.getInforGeneral);

// get sô lượng quân nhân từng đơn vị
router.get("/military/general", militaryController.getNumberMilLoc);

// get đối tượng của quân nhân
router.get("/military/object/:id", militaryController.getObjectMilitarys);

// lọc military
router.get("/military/list", militaryController.getMilitarys);

// router.get("/military/total", militaryController.getInforTotal);

router.get("/military/detail/:id", militaryController.getIdMilitary);

//
router.get("/list/filter", militaryController.getListFilter);
/////////////////////////////////////////////
////////////////////////////////
// Location

// get list of location
router.get("/location/list", locationController.getListLocation);

////////////////////////////////////////////
/////////////////////////////////
//position
//get list of position
router.get("/position/list", positionController.getPosition);

//get detail of position
router.get("/position/detail/:id", positionController.getDetailPosition);

/////////////////////////////////////////////
////////////////////////////////
/////////////////////
//relative
//get relative
router.get("/relative/list", relativeController.getRelatives);

// get detail relative
router.get("/relative/detail/:id", relativeController.getIdRelative);

//////////////////////////////////////////////
//////////////////////////////////
////////////////
//reward
// get reward
router.get("/reward/list", rewardController.getListReward);

//get detait reward
router.get("/reward/detait/:id", rewardController.getDetaitReward);

module.exports = router;
