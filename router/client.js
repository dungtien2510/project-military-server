const express = require("express");
const router = express.Router();
const militaryController = require("../controller/military");

router.get("/military/list", militaryController.getMilitarys);

router.get("/military/total", militaryController.getInforTotal);

router.get("/military/detail/:id", militaryController.getIdMilitary);

module.exports = router;
