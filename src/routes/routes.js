import express from "express";
import uploader from "../multer.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { methods as loginController } from "../controller/loginController.js";
import { methods as userControllers } from "../controller/userControllers.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();
const imagesRoutes = express.Router();

// Login - Users //

router.post("/login", loginController.Login); // Devuelve los datos del Usuario si la Autenticacion es Correcta
router.get("/account", userControllers.getUsers) // Devuelve Todos los Usuarios Existentes
router.get("/account/:id", userControllers.getUser) // Devuelve un usuario especifico por ID
router.post("/account", uploader("users").single("avatar"), userControllers.addUser) // Crea un Nuevo Usuario

// END //





// Routers - Images - Public //

imagesRoutes.use("/images", express.static(join(__dirname, "../static/images")));
imagesRoutes.use("/users", express.static(join(__dirname, "../static/images/users")));

// END Routers - Images - Public //

export { router, imagesRoutes   };
