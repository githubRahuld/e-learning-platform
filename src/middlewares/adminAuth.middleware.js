import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// admin authorize middleware function
const verifyAdmin = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (user && user?.role === "admin") {
            next();
        } else {
            // User does not have the required role, so send a forbidden error response
            throw new ApiError(
                404,
                "You do not have permission to access this resource"
            );
        }
    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "Error while verifying admin"
        );
    }
});

export { verifyAdmin };
