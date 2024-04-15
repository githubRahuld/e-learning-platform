import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateTokens = asyncHandler(async (userId) => {
    const user = await User.findById({ _id: userId });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
});

const registerUser = asyncHandler(async (req, res) => {
    const { erno, email, fullname, profilePicture, password } = req.body;

    try {
        if (
            [erno, email, fullname, profilePicture, password].some(
                (field) => field?.trim() === ""
            )
        ) {
            throw new ApiError(404, "All fields are required! ");
        }

        const user = await User.findOne({ $or: [{ erno }, { email }] });

        console.log("user:", user);

        if (user) {
            throw new ApiError(404, "User Already Existed! ");
        }

        // get path of dp
        const dpPath = req.files?.profilePicture[0]?.path;

        if (!dpPath) throw new ApiError(400, "Profile picture required! ");

        // save dp to cloudinary
        const dp = await uploadOnCloudinary(dpPath);

        if (!dp) {
            throw new ApiError(400, "Error while uploading file");
        }

        const newUser = await User.create({
            erno,
            email,
            fullname,
            profilePicture: dp.url,
            password,
        });

        const createdUser = await User.findById(newUser._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            throw new ApiError(400, "Error while registering user!");
        }

        console.log("user created");

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    createdUser,
                    "User registered Successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, "Server error while register");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, cpassword } = req.body;

    if ([email, password, cpassword].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required!");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "user not found with this email");
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
});

export { registerUser, loginUser };
