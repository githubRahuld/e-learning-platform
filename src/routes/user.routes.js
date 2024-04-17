import { Router } from "express";
import {
    assignSuperadminRole,
    loginUser,
    logoutUser,
    registerUser,
    verifyOtp,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";

const router = Router();

router
    .route("/register")
    .post(
        upload.fields([{ name: "profilePicture", maxCount: 1 }]),
        registerUser
    );

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/verify-otp").post(verifyOtp);
router
    .route("/assign-superadmin/:userId")
    .patch(verifyAdmin, assignSuperadminRole);

export default router;
