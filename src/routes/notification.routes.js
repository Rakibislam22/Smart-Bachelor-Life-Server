const express = require("express");
const router = express.Router();

const {
    registerToken,
    removeToken,
} = require("../controllers/notification.controller");
const { authUserMiddleware } = require("../middlewares/auth.middleware");

router.post("/register-token", authUserMiddleware, registerToken);
router.post("/remove-token", authUserMiddleware, removeToken);

module.exports = router;
