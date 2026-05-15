const express = require("express");
const { verifyJWT } = require("../middleware/auth.js");
const authController = require("../controllers/authController.js");

const router = express.Router();

router.get("/profile", verifyJWT, authController.getProfile);

module.exports = router;