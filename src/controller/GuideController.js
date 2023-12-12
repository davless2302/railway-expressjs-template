import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import CryptoJS from "crypto-js";
import path from "path";
import { fileURLToPath } from "url";
import { JWT_SECRET } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addGuide = async (req, res) => {
  const {
    guideNumber,
    materialType,
    date,
    costo,
    quantity,
    salida,
    km,
    kmRoute,
    destination,
    equipment,
    pPeajes,
    cPeajes,
    viaticos,
    fuel,
    fuelPayment,
  } = req.body;
  const files = req.files || null;
};

export const methods = {
  addGuide,
};
