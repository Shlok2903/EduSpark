const { signup, login, validateToken } = require("../Controllers/AuthController");
const { signupValidation, loginValidation } = require("../Middlewares/AuthValidation");
const { verifyToken } = require("../Middlewares/AuthMiddleware");

const router = require("express").Router();

router.post("/login", loginValidation, login);
router.post("/signup", signupValidation, signup);
router.post("/tutorsignup", signupValidation, signup);
router.get("/validate", verifyToken, validateToken);

module.exports = router;
