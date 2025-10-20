// routes/auth.js
const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { body, validationResult } = require("express-validator");

/**
 * ✅ POST /api/auth/login
 * Login without password
 */
router.post(
  "/login",
  // ✅ Validation
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .matches(/^(AG|SP|AD)(00[1-9]|0[1-9]\d|[1-9]\d{2})$/)
    .withMessage("Invalid username format"),

  // ✅ Handler
  async (req, res) => {
    console.log("🟡 [AUTH LOGIN] Incoming Request:", req.body);

    try {
      // ตรวจ validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ [AUTH LOGIN] Validation failed:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username } = req.body;
      console.log("🟢 [AUTH LOGIN] Username passed validation:", username);

      // ✅ เรียก service
      const result = await authService.loginWithoutPassword(username);
      console.log("✅ [AUTH LOGIN] Service result:", result);

      return res.status(200).json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error("🔥 [AUTH LOGIN] Error:", error);

      let statusCode = 500;
      let message = error.message || "Internal Server Error";

      if (error.message === "Invalid username") {
        statusCode = 401;
      } else if (error.message === "User account is inactive") {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
);

module.exports = router;
