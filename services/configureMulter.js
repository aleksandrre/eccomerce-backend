import multer from "multer";

const configureMulter = (maxFiles) => {
  const storage = multer.memoryStorage();
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  return (req, res) =>
    new Promise((resolve, reject) => {
      const middleware =
        maxFiles && maxFiles > 1
          ? upload.array("files", maxFiles)
          : upload.single("file");

      middleware(req, res, (err) => {
        if (err) {
          console.error(err);
          reject("Error uploading files");
        }

        resolve(req.files || req.file); // Resolve with the uploaded files or file
      });
    });
};

export default configureMulter;
