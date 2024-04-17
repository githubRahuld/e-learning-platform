import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
    {
        title: {
            type: String,
            lowercase: true,
            required: true,
            trim: true,
            unique: true,
        },
        category: {
            type: String,
            lowercase: true,
            required: true,
        },
        level: {
            type: String,
            lowercase: true,
            enum: ["beginner", "intermediate", "advanced"],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        noOfStudentsEnrolled: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Method to increment the number of students enrolled
courseSchema.methods.incrementEnrollmentCount = async function () {
    this.noOfStudentsEnrolled++;
    await this.save();
};

export const Course = mongoose.model("Course", courseSchema);
