import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.BUCKET_REGION as string,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY as string,
    secretAccessKey: process.env.SECRET_ACCESS_KEY as string,
  },
});

export const uploadFilesToS3 = async (files: Express.Multer.File[]): Promise<string[]> => {
  return Promise.all(
    files.map(async (file) => {
      const fileName = `uploads/${uuidv4()}-${file.originalname}`;
      const params = {
        Bucket: process.env.BUCKET_NAME as string,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        await s3Client.send(new PutObjectCommand(params));
        return fileName;
      } catch (uploadError) {
        console.error(uploadError);
        throw new Error("Error uploading files to S3");
      }
    })
  );
};

export const deleteFileFromS3 = async (filePath: string): Promise<void> => {
  const params = {
    Bucket: process.env.BUCKET_NAME as string,
    Key: filePath,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (deleteError) {
    console.error(deleteError);
    throw new Error("Error deleting file from S3");
  }
};

export const deleteFilesFromS3 = async (filePaths: string[]): Promise<void> => {
  try {
    const deletePromises = filePaths.map((filePath) => deleteFileFromS3(filePath));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting files from S3:", error);
    throw new Error("Error deleting files from S3");
  }
};

export const downloadFileFromS3 = async (filePath: string, res: Response): Promise<void> => {
  const params = {
    Bucket: process.env.BUCKET_NAME as string,
    Key: filePath,
  };

  try {
    const data = await s3Client.send(new GetObjectCommand(params));
    res.setHeader("Content-disposition", `attachment; filePath=${filePath}`);
    res.setHeader("Content-type", data.ContentType ?? "application/octet-stream");
    (data.Body as NodeJS.ReadableStream).pipe(res);
  } catch (error) {
    console.error("Error downloading file from S3:", error);
    res.status(500).send((error as Error).message || "Internal Server Error");
  }
};
