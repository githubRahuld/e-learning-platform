import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "e-learning platform",
    });

    // delete file from server
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error(
        "Local file path is required for deleting a file from Cloudinary"
      );
    }

    const deletionResponse = await cloudinary.uploader.destroy(localFilePath);

    console.log("File deleted successfully from Cloudinary", deletionResponse);

    return deletionResponse;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error.message);
    throw error;
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
