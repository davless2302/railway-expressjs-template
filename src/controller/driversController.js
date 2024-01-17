import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getDrivers = async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM choferes ");
    res.json(result);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
const getDriver = async (req, res) => {
  const { id } = req.params;
  try {
    const [query1] = await pool.query(
      "SELECT * FROM vehiculos WHERE id = ?",
      id
    );
    res.json(query1);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
const addDriver = async (req, res) => {
  const { type, marca, model, year, color, placa, km, sm, sc } = req.body;
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
    let sql = "";
    let values = [];

    // Verificar campos obligatorios según el tipo de vehículo
    if (
      (type === "CHUTO" &&
        (!marca || !model || !year || !color || !placa || !km || !sm || !sc)) ||
      (type === "REMOLQUE" && (!marca || !model || !year || !color))
    ) {
      await deleteFiles(files);
      return res.status(400).json({
        status: 400,
        message: "Bad Request - Missing required fields",
      });
    }

    // Verificar la presencia de archivos
    const images = files
      ? files.filter((el) => el.fieldname === "images")
      : null;
    const documents = files
      ? files.filter((el) => el.fieldname !== "images")
      : null;
    const filesNames = documents
      ? documents.map((el) => el.filename).join(",")
      : null;

    // Construir la sentencia SQL solo si no se sube ningún archivo
    if (
      !files ||
      (images && images.length === 0 && documents && documents.length === 0)
    ) {
      if (type === "CHUTO") {
        sql = `
          INSERT INTO cars (type, marca, model, year, color, placa, km, sm, sc)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [type, marca, model, year, color, placa, km, sm, sc];
      } else if (type === "REMOLQUE") {
        sql = `
          INSERT INTO cars (type, marca, model, year, color)
          VALUES (?, ?, ?, ?, ?)
        `;
        values = [type, marca, model, year, color];
      }

      const result = await pool.execute(sql, values);
      console.log(result);

      // Enviar respuesta de éxito
      return res
        .status(200)
        .json({ status: 200, message: "Vehiculo Ingresado Exitosamente" });
    }

    // Construir la sentencia SQL si se suben archivos
    if (type === "CHUTO") {
      sql = `
        INSERT INTO cars (type, marca, model, year, color, placa, km, sm, sc, images, documents)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      values = [
        type,
        marca,
        model,
        year,
        color,
        placa,
        km,
        sm,
        sc,
        images ? images[0].filename : null,
        filesNames ? filesNames : null,
      ];
    } else if (type === "REMOLQUE") {
      sql = `
        INSERT INTO cars (type, marca, model, year, color, images, documents)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      values = [
        type,
        marca,
        model,
        year,
        color,
        images ? images[0].filename : null,
        filesNames ? filesNames : null,
      ];
    }

    const result = await pool.execute(sql, values);

    // Enviar respuesta de éxito
    res
      .status(200)
      .json({ status: 200, message: "Vehiculo Ingresado Exitosamente" });
  } catch (error) {
    await deleteFiles(files);
    console.log(error);
    if (error.code === "ER_DUP_ENTRY") {
      let errorMessage;
      if (error.sqlMessage.includes("placa")) {
        errorMessage = "Placa en Uso";
      } else if (error.sqlMessage.includes("serialM")) {
        errorMessage = "Serial del Motor en Uso";
      } else if (error.sqlMessage.includes("serialC")) {
        errorMessage = "Serial del Chasis en Uso";
      } else {
        errorMessage = "Error Desconocido";
      }

      return res.status(400).json({ message: errorMessage });
    }

    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const methods = {
  getDrivers,
  getDriver,
  addDriver,
};
