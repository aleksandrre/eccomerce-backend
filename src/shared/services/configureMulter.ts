import multer from "multer";
import { Request, Response } from "express";

const configureMulter = (maxFiles: number) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  return (req: Request, res: Response): Promise<void> =>
    new Promise((resolve, reject) => {
      const middleware =
        maxFiles > 1
          ? upload.array("files", maxFiles)
          : upload.single("file");

      middleware(req, res, (err) => {
        if (err) {
          reject(new Error("Error uploading files"));
          return;
        }
        resolve();
      });
    });
};

export default configureMulter;
