import multer from "multer";
import { dirname, join, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIMETYPES = ["image/jpg", "image/png", "image/jpeg"];

const uploader = (formName) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const destination = join(__dirname, `./static/images/${formName}`);
        cb(null, destination);
      },
      filename: (req, file, cb) => {
        const fileExtension = extname(file.originalname);
        cb(null, `imagen_${Date.now()}${fileExtension}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (MIMETYPES.includes(file.mimetype)) cb(null, true);
      else cb(new Error(`Only ${MIMETYPES.join("")} mimetypes are allowed`), false);
    },
    limits: { fieldSize: 10000000 },
  });
};

export default uploader;
