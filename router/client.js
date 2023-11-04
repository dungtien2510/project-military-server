const express = require("express");
const router = express.Router();
const militaryController = require("../controller/military");

router.get("/military/list", militaryController.getMilitarys);

router.get("/military/general", militaryController.getInforGeneral);

router.get("/military/detail/:id", militaryController.getIdMilitary);

module.exports = router;
