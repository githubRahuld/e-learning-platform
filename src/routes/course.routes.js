import { Router } from "express";
import {
    addCourse,
    deleteCourse,
    enrollInCourse,
    getALlEnrolledCourses,
    getAllCourses,
    updateCourse,
} from "../controllers/course.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifySuperAdmin } from "../middlewares/adminAuth.middleware.js";
const router = Router();

router.route("/add-course").post(verifyJWT, addCourse);
router.route("/get-all-courses").get(verifyJWT, getAllCourses);
router.route("/enrollment").post(verifyJWT, enrollInCourse);
router.route("/get-enrolled-courses").get(verifyJWT, getALlEnrolledCourses);

router.route("/update-course/:courseId").patch(verifySuperAdmin, updateCourse);
router.route("/delete-course/:courseId").post(verifySuperAdmin, deleteCourse);

export default router;
