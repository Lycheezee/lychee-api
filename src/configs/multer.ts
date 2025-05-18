import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  cb(null, isValid);
};

export const upload = multer({ storage, fileFilter });
