import mongoose, { Schema } from "mongoose";

const enrollmentSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
});

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
