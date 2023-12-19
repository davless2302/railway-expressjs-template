import express from "express";
import uploader from "../multer.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { methods as loginController } from "../controller/loginController.js";
import { methods as userControllers } from "../controller/userControllers.js";
import { methods as carsControllers } from "../controller/carsController.js";
import { methods as tokenControllers } from "../controller/tokenController.js";
import { methods as equipmentController } from "../controller/equipmentController.js";
import { methods as GuideController } from "../controller/GuideController.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();
const imagesRoutes = express.Router();

// Login - Users //

router.post("/login", loginController.Login); // Devuelve los datos del Usuario si la Autenticacion es Correcta
router.get("/account", userControllers.getUsers); // Devuelve Todos los Usuarios Existentes
router.get("/account/:id", userControllers.getUser); // Devuelve un usuario especifico por ID
router.post(
  "/account",
  uploader("users").single("avatar"),
  userControllers.addUser
); // Crea un Nuevo Usuario

// END //

// Cars //

router.get("/cars", carsControllers.getCars); // Devuelve todos los Vehiculos Existentes
router.get("/cars/:id", carsControllers.getCar); // Devueve los Datos de un Vehiculo en especifico
router.post(
  "/cars",
  uploader("cars").any("images", "files"),
  carsControllers.addCar
); // Devueve los Datos de un Vehiculo en especifico

// END Cars //

// Equipment
router.get("/equipment", equipmentController.getEquipmentBefore); // Devuelve todos los Vehiculos y Choferes existentes
router.get("/equipment/active", equipmentController.getEquipments); // Devuelve todos los Equipos Activos
router.get("/equipment/:id", equipmentController.getEquipment); // Devuelve un equipo en especifico
router.post("/equipment", equipmentController.createEquipment); // Crear un nuevo equipo
router.post(
  "/drivers",
  uploader("drivers").any("imagen", "files"),
  equipmentController.addDriver
); // Crea un Nuevo Conductor

//

// TOKEN //

router.post("/refreshToken", tokenControllers.RefreshToken); // Refrescar el Token
//

// GEO //
router.post("/geo", userControllers.addGeo);
router.post("/getGeo/", userControllers.getGeo);

//

// Guide //
router.get("/guide/all", GuideController.getGuideAll);
router.get("/guide/:id", GuideController.getGuide);
router.post(
  "/CreateGuide",
  uploader("guide").any("files"),
  GuideController.addGuide
);
router.put(
  "/UpdateGuide",
  uploader("guide").any("files"),
  GuideController.UpdateGuide
);

// Routers - Images - Public //

imagesRoutes.use(
  "/images",
  express.static(join(__dirname, "../static/images"))
);
imagesRoutes.use(
  "/users",
  express.static(join(__dirname, "../static/images/users"))
);
imagesRoutes.use(
  "/cars",
  express.static(join(__dirname, "../static/images/cars"))
);

// END Routers - Images - Public //

export { router, imagesRoutes };
