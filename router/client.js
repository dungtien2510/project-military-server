const express = require("express");
const router = express.Router();
const militaryController = require("../controller/military");

router.get("/military/general", militaryController.getInforGeneral);

// get sô lượng quân nhân từng đơn vị
router.get("/military/location/:id", militaryController.getNumberMilLoc);

// get đối tượng của quân nhân
router.get("/military/object/:id", militaryController.getObjectMilitarys);

router.get("/military/list", militaryController.getMilitarys);

router.get("/military/total", militaryController.getInforTotal);

router.get("/military/detail/:id", militaryController.getIdMilitary);

module.exports = router;
