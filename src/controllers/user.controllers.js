import { Otp } from "../models/otp.model.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Resend } from "resend";

function generateOTP() {
    // Generate a random number between 0 and 9999
    const randomNum = Math.floor(Math.random() * 10000);

    // Ensure the number is 4 digits by adding 1000 if necessary
    return randomNum.toString().padStart(4, "0");
}

const sendEmail = asyncHandler(async (email, otp) => {
    console.log("INside send email");
    console.log(email);
    console.log(otp);

    let to = email;
    const resend = new Resend("re_5Pm4bwQa_79gk89tcbMNnqu5n5dSRZbd5");

    resend.emails.send({
        from: "onboarding@resend.dev",
        to: `${to}`,
        subject: "Hello World",
        html: `<h1>Your OTP: <strong>${otp}</strong></h1> <p>Expire in 1 minute</p>`,
    });
});

const generateTokens = async (userId) => {
    try {
        const user = await User.findById({ _id: userId });

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access tokens"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { erno, email, fullname, profilePicture, password } = req.body;

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
            new ApiResponse(200, createdUser, "User registered Successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, cpassword } = req.body;

    if ([email, password, cpassword].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required!");
    }

    if (password != cpassword) {
        throw new ApiError(400, "Password not matched");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "user not found with this email");
    }

    const isPassValid = await user.isPasswordCorrect(password);

    if (!isPassValid) throw new ApiError(400, "Password is not correct!");

    const newOtp = await Otp.create({
        userId: user._id,
        otp: generateOTP(),
        expiresAt: Date.now() + 60000, // Expires in 1 min
    });
    console.log("new otp : ", newOtp);
    console.log(user);
    console.log(newOtp.otp);

    // sendEmail(user.email, newOtp.otp);

    // console.log(loggedInUser);
    // console.log("accessToken: ", accessToken);
    // console.log("refreshToken: ", refreshToken);

    return res
        .status(200)

        .json(
            new ApiResponse(
                200,
                {},
                "Enter otp to logIn on OTP Verification API"
            )
        );
});

const verifyOtp = asyncHandler(async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        throw new ApiError(400, "Missing required parameters: userId and otp");
    }

    const user = await User.findOne({ _id: userId });
    console.log("User: ", user);

    // Find the OTP document associated with the user ID
    const otpDoc = await Otp.findOne({ userId });

    if (!otpDoc) {
        throw new ApiError(400, "Invalid OTP or user not found");
    }
    console.log("otpDoc: ", otpDoc);

    // Check if OTP is valid and not expired
    if (otpDoc.otp != otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (otpDoc.expiresAt < Date.now()) {
        await otpDoc.deleteOne();
        throw new ApiError(400, "OTP expired");
    }

    // OTP verification successful - generate tokens and user response
    const { accessToken, refreshToken } = await generateTokens(user._id);
    const loggedInUser = await User.findById({ _id: userId }).select(
        "-password -refreshToken"
    );

    console.log("loggedInUser", loggedInUser);

    // Delete the used OTP document
    await otpDoc.deleteOne({ userId: userId });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User loggedIn successfully"
            )
        );
});

// to logout user, remove refresh token from db
const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        { _id: req.user?._id },
        {
            $unset: {
                // update in database
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );
    console.log("User at logout: ", user);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logout successfully"));
});

const assignSuperadminRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById({ _id: userId });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Assign the superadmin role
    user.role = "superadmin";
    console.log(user);

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Role changed to superadmin"));
});

const update = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    if (!(fullname || email)) {
        throw new ApiError("Required fields");
    }

    const user = await User.findByIdAndUpdate(
        { _id: req.user?._id },
        {
            $set: {
                fullname,
                email,
            },
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError("User not found");
    }

    const updatedUser = await User.findById({ _id: user._id }).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "User details updated successfully"
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    verifyOtp,
    assignSuperadminRole,
    update,
};
