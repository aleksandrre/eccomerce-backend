import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Response } from "express";

const s3Client = new S3Client({
  region: process.env.BUCKET_REGION as string,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY as string,
    secretAccessKey: process.env.SECRET_ACCESS_KEY as string,
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
          Bucket: process.env.BUCKET_NAME as string,
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
      Bucket: process.env.BUCKET_NAME as string,
      Key: filePath,
    })
  );
};

export const deleteFilesFromS3 = async (
  filePaths: string[]
): Promise<void> => {
  await Promise.all(filePaths.map(deleteFileFromS3));
};

export const downloadFileFromS3 = async (
  filePath: string,
  res: Response
): Promise<void> => {
  try {
    const data = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME as string,
        Key: filePath,
      })
    );
    res.setHeader("Content-disposition", `attachment; filename=${filePath}`);
    res.setHeader(
      "Content-type",
      data.ContentType ?? "application/octet-stream"
    );
    (data.Body as NodeJS.ReadableStream).pipe(res);
  } catch (error) {
    res
      .status(500)
      .send((error as Error).message || "Internal Server Error");
  }
};
