import multer from "multer";
import { dirname, join, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIMETYPES = ["image/jpg", "image/png", "image/jpeg", "application/pdf"];

const uploader = (formName, options = {}) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const destination = join(__dirname, `./static/images/${formName}`);
        cb(null, destination);
      },
      filename: (req, file, cb) => {
        if (options.keepOriginalName) {
          // Si se quiere mantener el nombre original, generar un nombre único y agregar el nombre original
          const uniqueFilename = `imagen_${Date.now()}`;
          const fileExtension = extname(file.originalname);
          cb(null, `${uniqueFilename}.${file.originalname}`);
        } else {
          // Generar un nuevo nombre con la marca de tiempo
          const fileExtension = extname(file.originalname);
          cb(null, `imagen_${Date.now()}${fileExtension}`);
        }
      },
    }),
    fileFilter: (req, file, cb) => {
      if (MIMETYPES.includes(file.mimetype)) cb(null, true);
      else
        cb(
          new Error(`Only ${MIMETYPES.join("")} mimetypes are allowed`),
          false
        );
    },
    limits: { fieldSize: 10000000 },
  });
};

export default uploader;
