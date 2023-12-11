// import { pool } from "../Database/database.js";
import { JWT_SECRET } from "../config.js";
import jwt from "jsonwebtoken";
import aes from "crypto-js/aes.js";
import encUtf8 from "crypto-js/enc-utf8.js";

const RefreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token de actualización no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = {
      userId: decoded.id, // Ajusta según la estructura real de tu usuario
      username: decoded.username,
      userRol: decoded.rol,
      avatar: decoded.avatar,
      userEmail: decoded.email,
      nombre: decoded.nombre,
      apellido: decoded.apellido,
      // Agrega más información si es necesario
    };
    // Verifica el token de actualización
    // console.log(decoded);
    // Genera un nuevo token de acceso
    const newAccessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "12h",
    });
    // // Envía el nuevo token de acceso como respuesta
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error al verificar el token de actualización:", error);
    res.status(403).json({ message: "Token de actualización inválido" });
  }
};

export const methods = {
  RefreshToken,
};
