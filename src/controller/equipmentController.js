import { pool } from "../Database/database.js";
import { unlink } from "fs/promises"; // Use fs.promises for promises-based API
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getEquipmentBefore = async (req, res) => {
  try {
    const [query1] = await pool.query("SELECT * FROM cars ");
    const [query2] = await pool.query("SELECT * FROM choferes ");
    const result = {
      cars: query1,
      choferes: query2,
    };
    res.json(result);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};
const getEquipment = async (req, res) => {
  const { id } = req.params;
  try {
    const [query1] = await pool.query("SELECT * FROM equipos WHERE id = ?", id);
    res.json(query1);
  } catch (error) {
    res.status(500);
    res.send(error.message);
  }
};

const createEquipment = async (req, res) => {
  const { chutoID, remolqueID, choferID, alias } = req.body;

  if (chutoID === "" || remolqueID === "" || choferID === "") {
    res.status(400).json({ message: "Bad Request" });
  } else {
    try {
      // Inicia la transacción

      // Consulta para insertar en la tabla 'equipos'
      const sqlEquipos =
        "INSERT INTO equipos (idVehiculo, idChofer, idRemolque, alias) VALUES (?, ?, ?, ?)";
      const valuesEquipos = [chutoID, choferID, remolqueID, alias || null];
      await pool.execute(sqlEquipos, valuesEquipos);

      // Consultas para actualizar las tablas 'cars' y 'choferes'
      const sqlUpdateCars = "UPDATE cars SET inUse = ? WHERE id = ?";
      const valuesUpdateCars = ["Y", chutoID];
      await pool.execute(sqlUpdateCars, valuesUpdateCars);

      const valuesUpdateRemolque = ["Y", remolqueID];
      await pool.execute(sqlUpdateCars, valuesUpdateRemolque);

      const sqlUpdateChoferes = "UPDATE choferes SET inUse = ? WHERE id = ?";
      const valuesUpdateChoferes = ["Y", choferID];
      await pool.execute(sqlUpdateChoferes, valuesUpdateChoferes);

      // Confirma la transacción

      res.status(200).json({ message: "Equipo Asignado exitosamente" });
    } catch (error) {
      // Si hay un error, realiza un rollback para deshacer cualquier cambio

      console.error(error);
      res.status(500).json({ message: "Internal Error" });
    }
  }
};

const getEquipments = async (req, res) => {
  const query = `SELECT
  e.id AS idEquipo,
  e.estado as estadoEquipo,
  e.alias,
  c.id AS idChuto,
  c.marca AS marcaChuto,
  c.model AS modeloChuto,
  c.year AS yearChuto, 
  c.color AS colorChuto,
  c.placa AS placaChuto,
  c1.id AS idRemolque,
  c1.marca AS marcaRemolque,
  c1.model AS modeloRemolque,
  c1.year AS yearRemolque, 
  c1.color AS colorRemolque,
  ch.id AS idChofer,
  ch.cedula AS cedulaChofer,
  ch.fullName AS nombreChofer,
  ch.tlf AS tlfChofer
FROM
  equipos AS e
INNER JOIN
  cars AS c ON e.idVehiculo = c.id
INNER JOIN
  cars AS c1 ON e.idRemolque = c1.id
INNER JOIN
  choferes AS ch ON e.idChofer = ch.id
  `;
  const [result] = await pool.query(query);
  res.status(200).json(result);
};

const addDriver = async (req, res) => {
  const { cedula, fullName, address, tlf, gender, birthdate } = req.body;
  const files = req.files || null;

  const deleteFiles = async (files) => {
    if (files && files.length > 0) {
      for (let file of files) {
        const filePath = path.join(
          __dirname,
          "../static/images/drivers",
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

    // Verificar campos obligatorios
    if (!cedula || !fullName || !address || !tlf || !gender || !birthdate) {
      await deleteFiles(files);
      return res.status(400).json({
        status: 400,
        message: "Bad Request - Missing required fields",
      });
    }

    // Verificar la presencia de archivos
    const images = files
      ? files.filter((el) => el.fieldname === "imagen")
      : null;
    const documents = files
      ? files.filter((el) => el.fieldname !== "imagen")
      : null;
    const filesNames = documents
      ? documents.map((el) => el.filename).join(",")
      : null;

    // Construir la sentencia SQL solo si no se sube ningún archivo
    if (
      !files ||
      (images && images.length === 0 && documents && documents.length === 0)
    ) {
      sql = `
        INSERT INTO choferes (cedula, fullName, address, tlf, gender, birthdate )
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      values = [cedula, fullName, address, tlf, gender, birthdate];

      const result = await pool.execute(sql, values);

      // Enviar respuesta de éxito
      return res
        .status(200)
        .json({ status: 200, message: "Conductor Ingresado Exitosamente" });
    }

    // Construir la sentencia SQL si se suben archivos
    sql = `
      INSERT INTO choferes (cedula, fullName, address, tlf, gender, birthdate, imagen, documents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    values = [
      cedula,
      fullName,
      address,
      tlf,
      gender,
      birthdate,
      images ? images[0].filename : null,
      filesNames ? filesNames : null,
    ];

    const result = await pool.execute(sql, values);

    // Enviar respuesta de éxito
    res
      .status(200)
      .json({ status: 200, message: "Conductor Ingresado Exitosamente" });
  } catch (error) {
    await deleteFiles(files);
    console.log(error);
    if (error.code === "ER_DUP_ENTRY") {
      let errorMessage;
      if (error.sqlMessage.includes("cedula")) {
        errorMessage = "Cédula en Uso";
      } else {
        errorMessage = "Error Desconocido";
      }

      return res.status(400).json({ message: errorMessage });
    }

    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const methods = {
  getEquipmentBefore,
  getEquipment,
  createEquipment,
  getEquipments,
  addDriver,
};
