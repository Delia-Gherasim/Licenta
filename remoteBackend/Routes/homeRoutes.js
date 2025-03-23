const express = require("express");
const router = express.Router();
const { getHome } = require("../Controllers/controller");

router.get("/", getHome);

module.exports = router;
