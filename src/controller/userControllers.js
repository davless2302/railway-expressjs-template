import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import CryptoJS from "crypto-js";
import path from "path";
import { fileURLToPath } from "url";
import { JWT_SECRET } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ?",
      id
    );
    console.log(result);
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send(error.message);
  }
};

const getUsers = async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM usuarios ");
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send(error.message);
  }
};

const addUser = async (req, res) => {
  const key = JWT_SECRET;
  const { cedula, nombre, apellido, username, password, correo, rol, genero } =
    req.body;
  const file = req.file;

  try {
    if (
      !cedula ||
      !nombre ||
      !apellido ||
      !username ||
      !password ||
      !correo ||
      !rol ||
      !genero
    ) {
      if (file) {
        await unlink(
          path.join(__dirname, "../static/images/users", file.filename)
        );
      }
      return res
        .status(400)
        .json({
          message: "Bad Request: Por favor, complete todos los campos.",
        });
    }

    const avatar = file ? file.filename : null;
    const hashPassword = CryptoJS.AES.encrypt(password, key).toString();
    let sql = `INSERT INTO usuarios (cedula, nombre, apellido, username, password, email, rol, genero`;
    const values = [
      cedula,
      nombre,
      apellido,
      username,
      hashPassword,
      correo,
      rol,
      genero,
    ];

    if (avatar) {
      sql += `, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      values.push(avatar);
    } else {
      sql += `) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    }

    const result = await pool.query(sql, values);

    res.status(200).json({ message: "Nuevo Usuario Registrado." });
  } catch (error) {
    console.error(error);
    if (file) {
      await unlink(
        path.join(__dirname, "../static/images/users", file.filename)
      );
    }
    if (error.code === "ER_DUP_ENTRY") {
      if (error.sqlMessage.includes("username")) {
        return res.status(400).json({ message: "Nombre de Usuario en uso" });
      } else if (error.sqlMessage.includes("email")) {
        return res.status(400).json({ message: "Correo Electronico en uso" });
      } else {
        return res.status(400).json({ message: "Error Desconocido" });
      }
    }
    return res.status(500).json({ message: error.message });
  }
};

export const methods = {
  getUser,
  getUsers,
  addUser,
};
