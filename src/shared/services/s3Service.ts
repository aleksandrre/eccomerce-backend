import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";

const s3Client = new S3Client({
  region: env.BUCKET_REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
});

export const uploadFilesToS3 = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  return Promise.all(
    files.map(async (file) => {
      const fileName = `uploads/${uuidv4()}-${file.originalname}`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      return fileName;
    })
  );
};

export const deleteFileFromS3 = async (filePath: string): Promise<void> => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: filePath,
    })
  );
};

export const deleteFilesFromS3 = async (
  filePaths: string[]
): Promise<void> => {
  await Promise.all(filePaths.map(deleteFileFromS3));
};
