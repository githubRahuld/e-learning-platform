import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addCourse = asyncHandler(async (req, res) => {
    const { title, category, level, description } = req.body;

    if (
        [title, category, level, description].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError("All fields are required! ");
    }

    const user = await User.findById({ _id: req.user?._id });

    if (user.role != "superadmin") {
        throw new ApiError(404, "Not authorized to add course");
    }

    const existingCourse = await Course.findOne({ title });

    if (existingCourse) {
        throw new ApiError("Course already existed!");
    }

    const newCourse = await Course.create({
        title,
        category,
        level,
        description,
    });

    if (!newCourse) {
        throw new ApiError(400, "Error while adding new Course!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newCourse, "New course add successfully"));
});

const getAllCourses = asyncHandler(async (req, res) => {
    try {
        const { title, category, level, noOfStudentsEnrolled } = req.query;

        //  construct a MongoDB query object (query) based on the provided parameters
        const query = {};

        if (title) {
            query.title = title.toLowerCase();
        }
        if (category) {
            query.category = category.toLowerCase();
        }
        if (level) {
            query.level = level.toLowerCase();
        }

        if (noOfStudentsEnrolled) {
            query.popularity = { $gte: noOfStudentsEnrolled };
        }

        const courses = await Course.find(query).exec();
        console.log(courses);

        if (courses.length == 0) {
            return res
                .status(200)
                .json(new ApiResponse(200, {}, "no courses available "));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, courses, "all courses fetched "));
    } catch (error) {
        throw new ApiError(400, "Error while fetching all courses");
    }
});

const enrollInCourse = asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body;

    if (!(userId || courseId)) {
        throw new ApiError(400, "UserId and CourseId is required");
    }

    const alreadyApplied = await Enrollment.findOne({ userId, courseId });
    // console.log("alreadyApplied: ", alreadyApplied);

    if (alreadyApplied) {
        throw new ApiError(404, "You already enrolled in this course!");
    }

    const newEnrollment = await Enrollment.create({
        userId,
        courseId,
    });

    if (!newEnrollment) {
        throw new ApiError(400, "Error in enrollment of course");
    }

    // find course and increament noOfStudentsEnrolled count
    const findCourse = await Course.findById({ _id: courseId });
    if (!findCourse) {
        throw new ApiError(404, "Course not found");
    }
    findCourse.incrementEnrollmentCount();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newEnrollment,
                "Enrolled in course sucessfully"
            )
        );
});

const getALlEnrolledCourses = asyncHandler(async (req, res) => {
    const user = await User.findById({ _id: req.user?._id });

    if (!user) {
        throw new ApiError(400, "UserId required!");
    }

    const allCourses = await Enrollment.find({ userId: user._id });
    console.log("enrolled courses: ", allCourses);

    if (allCourses.length == 0) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "You Haven't enrolled in any course yet!"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allCourses,
                "Successfully fetched all enrolled courses."
            )
        );
});

const updateCourse = asyncHandler(async (req, res) => {
    const courseId = req.params.courseId;
    const { title, category, level, description } = req.body;

    if (
        [title, category, level, description, courseId].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError("All fields are required! ");
    }

    let course = await Course.findById({ _id: courseId });
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }

    const updateData = await Course.findByIdAndUpdate(
        courseId,
        {
            title: title,
            category: category,
            level: level,
            description: description,
        },
        {
            new: true,
        }
    );

    if (!updateData) {
        throw new ApiError(400, "All fields are not provided! ");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateData, "Successfully updated course "));
});

const deleteCourse = asyncHandler(async (req, res) => {
    const courseId = req.params.courseId;

    let course = await Course.findById({ _id: courseId });
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }

    await course.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, { course }, "Successfully deleted course "));
});

export {
    addCourse,
    getAllCourses,
    enrollInCourse,
    getALlEnrolledCourses,
    updateCourse,
    deleteCourse,
};
