import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },

    expiresAt: {
        type: Date,
        required: true,
    },
});

// Optional: Add an index on expiresAt for faster expiration checks
otpSchema.index({ expiresAt: 1 }, { expires: "index" }); // TTL index

export const Otp = mongoose.model("Otp", otpSchema);
