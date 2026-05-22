import express from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireJson } from "../middleware/contentTypeMiddleware.js";
import { authLoginLimiter, registerLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/register", registerLimiter, requireJson, authController.register);
router.post("/login/:role", authLoginLimiter, requireJson, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getMe);
router.patch("/me", requireAuth, requireJson, authController.updateMe);
router.patch("/me/password", requireAuth, requireJson, authController.changePassword);
router.delete("/me", requireAuth, authController.deleteMe);

export default router;
