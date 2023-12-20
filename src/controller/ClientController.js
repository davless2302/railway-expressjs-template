import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getClients = async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM clients ");
    res.json(result);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
const getClient = async (req, res) => {
  const { id } = req.params;
  try {
    const [query1] = await pool.query("SELECT * FROM clients WHERE id = ?", id);
    res.json(query1);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
const addClient = async (req, res) => {
  const { razonSocial, alias, rif, phone, direccion } = req.body;
  const files = req.files || null;
  const deleteFiles = async (files) => {
    if (files && files.length > 0) {
      for (let file of files) {
        const filePath = path.join(
          __dirname,
          "../static/images/cars",
          file.filename
        );

        try {
          await unlink(filePath);
          console.log(`Archivo eliminado: ${filePath}`);
        } catch (unlinkError) {
          console.error(
            `Error al eliminar el archivo: ${filePath}`,
            unlinkError
          );
        }
      }
    }
  };
  try {
    if (!razonSocial || !alias || !rif || !phone || !direccion) {
      if (files || files.length > 0) {
        await deleteFiles(files);
      }
      return res.status(400).json({ message: "Bad Request" });
    }
    const sql =
      "INSERT INTO clients (razonSocial, alias, rif, phone, direccion) VALUES (?,?,?,?,?)";
    const values = [razonSocial, alias, rif, phone, direccion];
    await pool.execute(sql, values);
    return res.status(200).json({ message: "Cliente Ingresado Exitosamente" });
  } catch (error) {
    await deleteFiles(files);
    console.log(error);
    if (error.code === "ER_DUP_ENTRY") {
      let errorMessage;
      if (error.sqlMessage.includes("rif")) {
        errorMessage = "Rif en Uso";
      } else {
        errorMessage = "Error Desconocido";
      }

      return res.status(400).json({ message: errorMessage });
    }

    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const methods = {
  getClients,
  getClient,
  addClient,
};
