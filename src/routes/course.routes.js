import { Router } from "express";
import {
    addCourse,
    enrollInCourse,
    getALlEnrolledCourses,
    getAllCourses,
} from "../controllers/course.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/add-course").post(verifyJWT, addCourse);
router.route("/get-all-courses").get(verifyJWT, getAllCourses);
router.route("/enrollment").post(verifyJWT, enrollInCourse);
router.route("/get-enrolled-courses").get(verifyJWT, getALlEnrolledCourses);

export default router;
