// services/s3Service.js
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();
const s3Client = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export const uploadFilesToS3 = async (files) => {
  console.log(files);
  return Promise.all(
    files.map(async (file) => {
      const fileName = `uploads/${uuidv4()}-${file.originalname}`;
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        await s3Client.send(new PutObjectCommand(params));
        return fileName; // Return the S3 file path
      } catch (uploadError) {
        console.error(uploadError);
        throw new Error("Error uploading files to S3");
      }
    })
  );
};
export const deleteFileFromS3 = async (filePath) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: filePath,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (deleteError) {
    console.error(deleteError);
    throw new Error("Error deleting file from S3");
  }
};

export const deleteFilesFromS3 = async (filePaths) => {
  try {
    const deletePromises = filePaths.map((filePath) =>
      deleteFileFromS3(filePath)
    );
    await Promise.all(deletePromises); // Wait for all files to be deleted
  } catch (error) {
    console.error("Error deleting files from S3:", error);
    throw new Error("Error deleting files from S3");
  }
};

export async function downloadFileFromS3(filePath, res) {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: filePath, // Specify the key of the file in your S3 bucket
  };

  try {
    const data = await s3Client.send(new GetObjectCommand(params));

    // Set appropriate headers for the response
    res.setHeader("Content-disposition", `attachment; filePath=${filePath}`);
    res.setHeader("Content-type", data.ContentType);

    // Stream the file data to the response
    data.Body.pipe(res);
  } catch (error) {
    console.error("Error downloading file from S3:", error);
    res.status(500).send(error.message || "Internal Server Error");
  }
}
