import multer from "multer";
import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/errorCodes";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Returns a promise-based multipart parser. Images are held in memory (max 5MB
 * each) and later streamed to S3. Rejects with an AppError so upload failures
 * surface through the central error handler as VALIDATION_ERROR.
 */
const configureMulter = (maxFiles: number) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new AppError(
            400,
            ErrorCode.VALIDATION_ERROR,
            "Only image files (jpeg, png, webp, gif) are allowed"
          )
        );
      }
    },
  });

  return (req: Request, res: Response): Promise<void> =>
    new Promise((resolve, reject) => {
      const middleware =
        maxFiles > 1
          ? upload.array("files", maxFiles)
          : upload.single("file");

      middleware(req, res, (err) => {
        if (err) {
          reject(
            err instanceof AppError
              ? err
              : new AppError(
                  400,
                  ErrorCode.VALIDATION_ERROR,
                  err.message || "File upload error"
                )
          );
          return;
        }
        resolve();
      });
    });
};

export default configureMulter;
