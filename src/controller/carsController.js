import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import CryptoJS from "crypto-js";
import path from "path";
import { fileURLToPath } from "url";
import { HASH } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getCars = async (req, res) => {
  try {
    const [result] = await pool.query("SELECT * FROM vehiculos ");
    res.json(result);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
const getCar = async (req, res) => {
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
const addCar = async (req, res) => {
  const { type, marca, model, year, color, placa, km, sm, sc } = req.body;
  const files = req.files || null;

  try {
    // Verificar campos obligatorios según el tipo de vehículo
    if (
      (type === "CHUTO" &&
        (!marca || !model || !year || !color || !placa || !km || !sm || !sc)) ||
      (type === "REMOLQUE" && (!marca || !model || !year || !color))
    ) {
      // Eliminar archivos si existen
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

      return res.status(400).json({
        status: 400,
        message: "Bad Request - Missing required fields",
      });
    }

    // Verificar la presencia de archivos
    if (files && files.length !== 0) {
      const images = files.filter((el) => el.fieldname === "images");
      const documents = files.filter((el) => el.fieldname !== "images");
      let filesNames = documents.map((el) => el.filename).join(",");
      console.log(filesNames);
      let sql = "";
      let values = [];

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
      } else {
        // Agrega lógica adicional para otros tipos si es necesario
      }
      const result = await pool.execute(sql, values);
      console.log(result);
      // Puedes hacer algo con las imágenes y documentos aquí, si es necesario.
      // Por ejemplo, almacenarlas, procesarlas, etc.

      // console.log("Imágenes:", images);
      // console.log("Documentos:", documents);
    } else {
      // Si no se han subido archivos, puedes manejarlo aquí.
      // console.log("No se han subido archivos.");
    }

    // Puedes agregar lógica adicional según tus necesidades.

    // Enviar respuesta de éxito
    res.status(200).json({ status: 200, message: "Car added successfully" });
  } catch (error) {
    if (files) {
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
    if (error.code === "ER_DUP_ENTRY") {
      console.log(error);
      if (error.sqlMessage.includes("placa")) {
        return res.status(400).json({ message: "Placa en Uso" });
      } else if (error.sqlMessage.includes("sm")) {
        return res.status(400).json({ message: "Serial del Motor en Uso" });
      } else if (error.sqlMessage.includes("sc")) {
        return res.status(400).json({ message: "Serial del Chasis en Uso" });
      } else {
        return res.status(400).json({ message: "Error Desconocido" });
      }
    }
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const methods = {
  getCars,
  getCar,
  addCar,
};
